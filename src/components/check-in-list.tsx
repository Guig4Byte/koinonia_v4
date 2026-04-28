"use client";

import Link from "next/link";
import { Plus, UserRoundCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button, GhostButton } from "@/components/ui/button";
import { findDuplicateVisitorName } from "@/features/check-in/visitor-validation";
import { cn } from "@/lib/cn";

type MemberAttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED";
type AttendanceStatus = MemberAttendanceStatus | "VISITOR";
type AttendanceSelection = MemberAttendanceStatus | null;
type CheckInMode = "register" | "adjust";

type Member = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

type VisitorRecord = {
  id: string;
  fullName: string;
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
  initialVisitors = [],
  initialVisitorCount = 0,
  submitLabel = "Finalizar",
  mode = "register",
  attentionHref = "/pessoas",
  attentionLabel = "Ver pessoas em atenção",
}: {
  eventId: string;
  members: Member[];
  initialVisitors?: VisitorRecord[];
  initialVisitorCount?: number;
  submitLabel?: string;
  mode?: CheckInMode;
  attentionHref?: string;
  attentionLabel?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [savedAttentionCount, setSavedAttentionCount] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [savedVisitors, setSavedVisitors] = useState<VisitorRecord[]>(initialVisitors);
  const fallbackSavedVisitorCount = Math.max(initialVisitorCount, savedVisitors.length);
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
    const visitorTotal = fallbackSavedVisitorCount + visitors.length;
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
  }, [fallbackSavedVisitorCount, items, visitors.length]);

  const canSave = summary.pending === 0 && !isPending && !saved;
  const hasSavedAttention = savedAttentionCount !== null ? savedAttentionCount > 0 : summary.attentionCount > 0;
  const helperText =
    mode === "adjust"
      ? "Revise as marcações já salvas e corrija somente o necessário."
      : "Marque a presença sem transformar cuidado em relatório. O sistema só precisa saber quem pode merecer atenção.";

  function clearTransientState() {
    setSaved(false);
    setSavedAttentionCount(null);
    setErrorMessage(null);
  }

  function setStatus(personId: string, status: MemberAttendanceStatus) {
    clearTransientState();
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function markPendingAsPresent() {
    clearTransientState();
    setItems((current) => current.map((item) => (item.status ? item : { ...item, status: ATTENDANCE.PRESENT })));
  }

  function addVisitor() {
    const name = visitorName.trim();
    if (!name) return;

    const duplicate = findDuplicateVisitorName(savedVisitors, [...visitors, { fullName: name }]);
    if (duplicate) {
      setErrorMessage(duplicate + " já está registrado como visitante neste encontro.");
      return;
    }

    clearTransientState();
    setVisitors((current) => [...current, { id: makeVisitorId(), fullName: name }]);
    setVisitorName("");
  }

  function removeVisitor(id: string) {
    clearTransientState();
    setVisitors((current) => current.filter((visitor) => visitor.id !== id));
  }

  function save() {
    if (summary.pending > 0) {
      setErrorMessage("Marque todas as pessoas antes de finalizar a presença.");
      setSaved(false);
      return;
    }

    if (saved) return;

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

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(payload?.error ?? "Não foi possível salvar a presença.");
        return;
      }

      setSavedAttentionCount(typeof payload?.openSignalPeopleCount === "number" ? payload.openSignalPeopleCount : null);
      setSaved(true);
      setSavedVisitors((current) => [...current, ...visitors]);
      setVisitors([]);
    });
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Presença do encontro</p>
            <p className="text-3xl font-bold text-[var(--color-metric-presenca)]">{summary.presenceRate}%</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {summary.present} de {summary.totalMembers} presentes · {summary.visitorTotal} {summary.visitorTotal === 1 ? "visitante" : "visitantes"}
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {summary.pending > 0 ? `${summary.pending} pendente${summary.pending === 1 ? "" : "s"}` : "Tudo marcado"}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{helperText}</p>

        {summary.pending > 0 ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm text-[var(--color-badge-atencao-text)]">
            <p className="font-semibold">
              {summary.pending} {summary.pending === 1 ? "pessoa ainda está pendente" : "pessoas ainda estão pendentes"}.
            </p>
            <p className="mt-1 text-xs leading-relaxed">Use o atalho se todos vieram e depois ajuste só ausências ou justificativas.</p>
            <GhostButton type="button" onClick={markPendingAsPresent} className="mt-3 min-h-10 w-full rounded-xl px-3 text-xs">
              Marcar pendentes como presentes
            </GhostButton>
          </div>
        ) : null}

        {errorMessage ? (
          <div aria-live="polite" className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm font-medium text-[var(--color-badge-atencao-text)]">
            {errorMessage}
          </div>
        ) : null}

        {saved ? (
          <div aria-live="polite" className="mt-4 rounded-2xl bg-[var(--metric-card-bg)] p-3 text-sm text-[var(--color-text-primary)]">
            <div className="flex items-center gap-2 font-semibold">
              <UserRoundCheck className="h-4 w-4 text-[var(--color-metric-presenca)]" />
              Presença salva.
            </div>
            <p className="mt-1 text-[var(--color-text-secondary)]">
              {savedAttentionCount !== null
                ? savedAttentionCount > 0
                  ? `${savedAttentionCount} ${savedAttentionCount === 1 ? "pessoa está" : "pessoas estão"} em atenção na célula.`
                  : "Nenhum motivo de atenção ficou ativo na célula."
                : summary.attentionCount > 0
                  ? `${summary.attentionCount} ${summary.attentionCount === 1 ? "pessoa ficou" : "pessoas ficaram"} em atenção depois deste encontro.`
                  : "Nenhuma ausência pediu atenção neste encontro."}
            </p>
            {hasSavedAttention ? (
              <Link href={attentionHref} className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)]">
                {attentionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Visitantes</p>
        {savedVisitors.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Já registrados</p>
            {savedVisitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">registrado</span>
              </div>
            ))}
          </div>
        ) : fallbackSavedVisitorCount > 0 ? (
          <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {fallbackSavedVisitorCount} {fallbackSavedVisitorCount === 1 ? "visitante já registrado" : "visitantes já registrados"}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Nenhum visitante registrado neste encontro.</p>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={visitorName}
            onChange={(event) => setVisitorName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addVisitor();
              }
            }}
            placeholder="Adicionar visitante"
            className="min-h-11 flex-1 rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
          />
          <GhostButton type="button" onClick={addVisitor} className="px-3" aria-label="Adicionar visitante">
            <Plus className="h-4 w-4" />
          </GhostButton>
        </div>

        {visitors.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Para salvar agora</p>
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
                {item.status ? labels[item.status] : "Pendente"}
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

      <div className="sticky bottom-[86px] z-10 rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-tab)] p-3 shadow-card backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {summary.pending > 0 ? `${summary.pending} pendente${summary.pending === 1 ? "" : "s"}` : "Presença pronta"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {summary.pending > 0 ? "Finalize depois de marcar todos." : saved ? "Altere alguma marcação para salvar de novo." : "Salve para atualizar a atenção da célula."}
            </p>
          </div>
          <Button disabled={!canSave} onClick={save} className="min-w-28">
            {isPending ? "Salvando..." : saved ? "Presença salva" : submitLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
