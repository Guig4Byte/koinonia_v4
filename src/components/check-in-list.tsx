"use client";

import { Plus, UserRoundCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button, GhostButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type AttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED" | "VISITOR";

type Member = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

type VisitorDraft = {
  id: string;
  fullName: string;
};

const ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  JUSTIFIED: "JUSTIFIED",
  VISITOR: "VISITOR",
} as const satisfies Record<AttendanceStatus, AttendanceStatus>;

const labels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

function makeVisitorId() {
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function CheckInList({
  eventId,
  members,
  initialVisitorCount = 0,
  submitLabel = "Finalizar",
}: {
  eventId: string;
  members: Member[];
  initialVisitorCount?: number;
  submitLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [committedVisitorCount, setCommittedVisitorCount] = useState(initialVisitorCount);
  const [visitors, setVisitors] = useState<VisitorDraft[]>([]);
  const [items, setItems] = useState(
    members.map((member) => ({
      personId: member.personId,
      fullName: member.fullName,
      status: member.currentStatus ?? ATTENDANCE.ABSENT,
    })),
  );

  const summary = useMemo(() => {
    const accountable = items.filter((item) => item.status !== ATTENDANCE.VISITOR);
    const present = accountable.filter((item) => item.status === ATTENDANCE.PRESENT).length;
    const justified = accountable.filter((item) => item.status === ATTENDANCE.JUSTIFIED).length;
    const absent = accountable.filter((item) => item.status === ATTENDANCE.ABSENT).length;
    const visitorTotal = committedVisitorCount + visitors.length;
    const presenceRate = accountable.length === 0 ? 0 : Math.round((present / accountable.length) * 100);

    return {
      accountable: accountable.length,
      present,
      justified,
      absent,
      visitorTotal,
      presenceRate,
      attentionCount: absent,
    };
  }, [committedVisitorCount, items, visitors.length]);

  function setStatus(personId: string, status: AttendanceStatus) {
    setSaved(false);
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function addVisitor() {
    const name = visitorName.trim();
    if (!name) return;
    setSaved(false);
    setVisitors((current) => [...current, { id: makeVisitorId(), fullName: name }]);
    setVisitorName("");
  }

  function removeVisitor(id: string) {
    setSaved(false);
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  }

  function save() {
    startTransition(async () => {
      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendances: items.map(({ personId, status }) => ({ personId, status })),
          visitors: visitors.map((visitor) => ({ fullName: visitor.fullName })),
        }),
      });

      if (!response.ok) {
        alert("Não foi possível salvar o check-in.");
        return;
      }

      setSaved(true);
      setCommittedVisitorCount((current) => current + visitors.length);
      setVisitors([]);
    });
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Presença de hoje</p>
            <p className="text-3xl font-bold text-[var(--color-metric-presenca)]">{summary.presenceRate}%</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {summary.present} de {summary.accountable} presentes · {summary.visitorTotal} {summary.visitorTotal === 1 ? "visitante" : "visitantes"}
            </p>
          </div>
          <Button disabled={isPending} onClick={save} className="min-w-28">
            {isPending ? "Salvando..." : saved ? "Salvo" : submitLabel}
          </Button>
        </div>

        {saved ? (
          <div className="mt-4 rounded-2xl bg-[var(--metric-card-bg)] p-3 text-sm text-[var(--color-text-primary)]">
            <div className="flex items-center gap-2 font-semibold">
              <UserRoundCheck className="h-4 w-4 text-[var(--color-metric-presenca)]" />
              Presença registrada.
            </div>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              {summary.attentionCount > 0
                ? `${summary.attentionCount} ${summary.attentionCount === 1 ? "pessoa merece" : "pessoas merecem"} atenção depois deste encontro.`
                : "Nenhuma atenção nova apareceu neste encontro."}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Adicionar visitante</p>
        <div className="mt-3 flex gap-2">
          <input
            value={visitorName}
            onChange={(event) => setVisitorName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addVisitor();
              }
            }}
            placeholder="Nome do visitante"
            className="min-h-11 flex-1 rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
          />
          <GhostButton type="button" onClick={addVisitor} className="px-3">
            <Plus className="h-4 w-4" />
          </GhostButton>
        </div>

        {visitors.length > 0 ? (
          <div className="mt-3 space-y-2">
            {visitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <button type="button" onClick={() => removeVisitor(visitor.id)} className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  remover
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.personId} className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-semibold text-[var(--color-text-primary)]">{item.fullName}</p>
              <span className="rounded-full bg-[var(--metric-card-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)]">
                {labels[item.status]}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[ATTENDANCE.PRESENT, ATTENDANCE.ABSENT, ATTENDANCE.JUSTIFIED].map((status) => (
                <GhostButton
                  key={status}
                  onClick={() => setStatus(item.personId, status)}
                  className={cn(
                    "min-h-10 rounded-xl px-2 text-xs",
                    item.status === status ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-btn-primary-text)]" : "",
                  )}
                >
                  {labels[status]}
                </GhostButton>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
