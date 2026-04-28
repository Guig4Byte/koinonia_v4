"use client";

import { Plus, UserRoundCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button, GhostButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type MemberAttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED";
type AttendanceStatus = MemberAttendanceStatus | "VISITOR";
type AttendanceSelection = MemberAttendanceStatus | null;

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

const labels: Record<MemberAttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
};

function makeVisitorId() {
  return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitialMemberStatus(status?: AttendanceStatus | null): AttendanceSelection {
  if (!status || status === ATTENDANCE.VISITOR) return null;
  return status;
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [committedVisitorCount, setCommittedVisitorCount] = useState(initialVisitorCount);
  const [visitors, setVisitors] = useState<VisitorDraft[]>([]);
  const [items, setItems] = useState(
    members.map((member) => ({
      personId: member.personId,
      fullName: member.fullName,
      status: getInitialMemberStatus(member.currentStatus),
    })),
  );

  const summary = useMemo(() => {
    const marked = items.filter((item) => item.status !== null);
    const present = items.filter((item) => item.status === ATTENDANCE.PRESENT).length;
    const justified = items.filter((item) => item.status === ATTENDANCE.JUSTIFIED).length;
    const absent = items.filter((item) => item.status === ATTENDANCE.ABSENT).length;
    const pending = items.length - marked.length;
    const visitorTotal = committedVisitorCount + visitors.length;
    const presenceRate = items.length === 0 ? 0 : Math.round((present / items.length) * 100);

    return {
      totalMembers: items.length,
      present,
      justified,
      absent,
      pending,
      visitorTotal,
      presenceRate,
      attentionCount: absent,
    };
  }, [committedVisitorCount, items, visitors.length]);

  const canSave = summary.pending === 0 && !isPending;

  function setStatus(personId: string, status: MemberAttendanceStatus) {
    setSaved(false);
    setErrorMessage(null);
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function addVisitor() {
    const name = visitorName.trim();
    if (!name) return;
    setSaved(false);
    setErrorMessage(null);
    setVisitors((current) => [...current, { id: makeVisitorId(), fullName: name }]);
    setVisitorName("");
  }

  function removeVisitor(id: string) {
    setSaved(false);
    setErrorMessage(null);
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  }

  function save() {
    if (summary.pending > 0) {
      setErrorMessage("Marque todas as pessoas antes de finalizar a presença.");
      return;
    }

    startTransition(async () => {
      setErrorMessage(null);

      const response = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendances: items.map(({ personId, status }) => ({ personId, status })),
          visitors: visitors.map((visitor) => ({ fullName: visitor.fullName })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setErrorMessage(payload?.error ?? "Não foi possível salvar o check-in.");
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
              {summary.present} de {summary.totalMembers} presentes · {summary.visitorTotal} {summary.visitorTotal === 1 ? "visitante" : "visitantes"}
            </p>
          </div>
          <Button disabled={!canSave} onClick={save} className="min-w-28">
            {isPending ? "Salvando..." : saved ? "Salvo" : submitLabel}
          </Button>
        </div>

        {summary.pending > 0 ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm text-[var(--color-badge-atencao-text)]">
            <p className="font-semibold">
              {summary.pending} {summary.pending === 1 ? "pessoa ainda não foi marcada" : "pessoas ainda não foram marcadas"}.
            </p>
            <p className="mt-1 text-xs leading-relaxed">Finalize só depois de marcar presente, ausente ou justificou para cada membro.</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm font-medium text-[var(--color-badge-atencao-text)]">
            {errorMessage}
          </div>
        ) : null}

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
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  item.status
                    ? "bg-[var(--metric-card-bg)] text-[var(--color-text-secondary)]"
                    : "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[var(--color-badge-atencao-text)]",
                )}
              >
                {item.status ? labels[item.status] : "Não marcado"}
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
