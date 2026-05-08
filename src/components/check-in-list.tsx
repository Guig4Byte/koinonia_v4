"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Button, GhostButton } from "@/components/ui/button";
import { findDuplicateVisitorName } from "@/features/check-in/visitor-validation";
import { cn } from "@/lib/cn";
import { isRecord, readJsonResponse } from "@/lib/json";

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

type CheckInItem = {
  personId: string;
  fullName: string;
  status: AttendanceSelection;
};

type CheckInResponse = {
  error?: string;
};

function isCheckInResponse(value: unknown): value is CheckInResponse {
  return (
    isRecord(value)
    && (value.error === undefined || typeof value.error === "string")
  );
}

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

function memberCardTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return "check-in-member-card-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-member-card-absent";
  if (status === ATTENDANCE.JUSTIFIED) return "check-in-member-card-justified";
  return "check-in-member-card-pending";
}

function statusButtonTone(status: MemberAttendanceStatus, selected: boolean) {
  if (!selected) return "check-in-status-button";
  if (status === ATTENDANCE.PRESENT) return "check-in-status-button-selected-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-status-button-selected-absent";
  return "check-in-status-button-selected-justified";
}

function statusBadgeTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return "check-in-status-badge-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-status-badge-absent";
  if (status === ATTENDANCE.JUSTIFIED) return "check-in-status-badge-justified";
  return "check-in-status-badge-pending";
}

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
  submitLabel = "Salvar presença",
  mode = "register",
  cancelHref,
  cancelLabel = "Cancelar",
  saveBarOffset = "nav",
}: {
  eventId: string;
  members: Member[];
  initialVisitors?: VisitorRecord[];
  initialVisitorCount?: number;
  submitLabel?: string;
  mode?: CheckInMode;
  cancelHref?: string;
  cancelLabel?: string;
  saveBarOffset?: "nav" | "page";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [savedVisitors] = useState<VisitorRecord[]>(initialVisitors);
  const fallbackSavedVisitorCount = Math.max(initialVisitorCount, savedVisitors.length);
  const [visitors, setVisitors] = useState<VisitorDraft[]>([]);
  const [items, setItems] = useState<CheckInItem[]>(
    members.map((member) => ({
      personId: member.personId,
      fullName: member.fullName,
      status: getInitialMemberStatus(member.currentStatus),
    })),
  );

  const summary = useMemo(() => {
    const counts = items.reduce(
      (acc, item) => {
        if (item.status === ATTENDANCE.PRESENT) acc.present += 1;
        else if (item.status === ATTENDANCE.JUSTIFIED) acc.justified += 1;
        else if (item.status === ATTENDANCE.ABSENT) acc.absent += 1;
        else acc.pending += 1;

        return acc;
      },
      {
        totalMembers: items.length,
        present: 0,
        justified: 0,
        absent: 0,
        pending: 0,
      },
    );

    const visitorTotal = fallbackSavedVisitorCount + visitors.length;
    const hasPresenceData = counts.totalMembers > 0 && counts.pending === 0;
    const presenceRate = hasPresenceData ? Math.round((counts.present / counts.totalMembers) * 100) : 0;

    return {
      ...counts,
      visitorTotal,
      presenceRate,
      hasPresenceData,
    };
  }, [fallbackSavedVisitorCount, items, visitors.length]);

  const canSave = summary.pending === 0 && !isPending;
  const allMembersPresent = summary.totalMembers > 0 && summary.present === summary.totalMembers;
  const helperText =
    mode === "adjust"
      ? "Corrija apenas o que mudou neste encontro."
      : "Marque quem veio. Só isso já ajuda a lembrar quem pode precisar de cuidado.";

  function clearTransientState() {
    setErrorMessage(null);
  }

  function setStatus(personId: string, status: MemberAttendanceStatus) {
    clearTransientState();
    setItems((current) => current.map((item) => (item.personId === personId ? { ...item, status } : item)));
  }

  function markAllAsPresent() {
    const hasNonPresentStatus = items.some((item) => item.status !== ATTENDANCE.PRESENT);

    if (!hasNonPresentStatus) return;

    const hasAbsenceOrJustification = items.some(
      (item) => item.status === ATTENDANCE.ABSENT || item.status === ATTENDANCE.JUSTIFIED,
    );

    if (
      hasAbsenceOrJustification
      && !window.confirm("Isso vai trocar ausentes e justificativas para presentes. Continuar?")
    ) {
      return;
    }

    clearTransientState();
    setItems((current) => current.map((item) => ({ ...item, status: ATTENDANCE.PRESENT })));
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
      setErrorMessage("Ainda falta marcar algumas pessoas antes de salvar a presença.");
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

      const payload = await readJsonResponse(response);
      const responseBody = isCheckInResponse(payload) ? payload : null;

      if (!response.ok) {
        setErrorMessage(responseBody?.error ?? "Não foi possível salvar a presença.");
        return;
      }

      const confirmation = mode === "adjust" ? "atualizada" : "registrada";
      router.replace(`/eventos/${eventId}?presenca=${confirmation}`);
    });
  }

  return (
    <section className="space-y-3">
      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)]">Presença do encontro</p>
            <p className="text-3xl font-bold text-[var(--color-metric-presenca)]">{summary.hasPresenceData ? `${summary.presenceRate}%` : "—"}</p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              {summary.pending > 0
                ? `${summary.totalMembers - summary.pending} de ${summary.totalMembers} marcados`
                : `${summary.present} de ${summary.totalMembers} presentes`}
              {" · "}
              {summary.visitorTotal} {summary.visitorTotal === 1 ? "visitante" : "visitantes"}
            </p>
          </div>
          <div className="rounded-full border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {summary.pending > 0 ? `Faltam ${summary.pending}` : "Tudo marcado"}
          </div>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{helperText}</p>

        {!allMembersPresent ? (
          <GhostButton
            type="button"
            onClick={markAllAsPresent}
            disabled={isPending}
            className="mt-4 min-h-10 w-full rounded-xl px-3 text-xs"
          >
            Marcar todos como presentes
          </GhostButton>
        ) : null}

        {summary.pending > 0 ? (
          <div className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm text-[var(--color-badge-atencao-text)]">
            <p className="font-semibold">
              {summary.pending === 1 ? "Falta marcar 1 pessoa." : `Falta marcar ${summary.pending} pessoas.`}
            </p>
            <p className="mt-1 text-xs leading-relaxed">Se todos vieram, use o atalho acima e ajuste só exceções.</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div aria-live="polite" className="mt-4 rounded-2xl border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] p-3 text-sm font-medium text-[var(--color-badge-atencao-text)]">
            {errorMessage}
          </div>
        ) : null}

      </div>

      <div className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
        <p className="font-semibold text-[var(--color-text-primary)]">Visitantes do encontro</p>
        {savedVisitors.length > 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Já salvos</p>
            {savedVisitors.map((visitor) => (
              <div key={visitor.id} className="flex items-center justify-between rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm">
                <span className="font-medium text-[var(--color-text-primary)]">{visitor.fullName}</span>
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">salvo</span>
              </div>
            ))}
          </div>
        ) : fallbackSavedVisitorCount > 0 ? (
          <p className="mt-3 rounded-2xl bg-[var(--metric-card-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {fallbackSavedVisitorCount} {fallbackSavedVisitorCount === 1 ? "visitante já salvo" : "visitantes já salvos"}.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Nenhum visitante neste encontro até agora.</p>
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">Para incluir ao salvar</p>
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
          <article
            key={item.personId}
            className={cn("check-in-member-card rounded-2xl border p-3 shadow-card", memberCardTone(item.status))}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-semibold text-[var(--color-text-primary)]">{item.fullName}</p>
              <span
                className={cn(
                  "check-in-status-badge rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  statusBadgeTone(item.status),
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
                  className={cn("min-h-10 rounded-xl px-2 text-xs", statusButtonTone(status, item.status === status))}
                >
                  {labels[status]}
                </GhostButton>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div
        className={cn(
          "check-in-save-bar rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-tab)] p-3 shadow-card backdrop-blur-xl",
          saveBarOffset === "page" ? "check-in-save-bar-page" : "check-in-save-bar-nav",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {summary.pending > 0 ? `Faltam ${summary.pending}` : "Pronto para salvar"}
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
              {summary.pending > 0
                ? "Marque todos para salvar."
                : mode === "adjust"
                  ? "Revise e salve as mudanças."
                  : "Depois, acompanhe quem precisar."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {cancelHref ? (
              <Link
                href={cancelHref}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]"
              >
                {cancelLabel}
              </Link>
            ) : null}
            <Button disabled={!canSave} onClick={save} className="min-w-28">
              {isPending ? "Salvando..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
