"use client";

import { GhostButton } from "@/components/ui/button";
import { countLabel } from "@/lib/format";
import type { CheckInSummary } from "@/features/check-in/check-in-view";

type CheckInSummaryCardProps = {
  summary: CheckInSummary;
  helperText: string;
  allMembersPresent: boolean;
  isPending: boolean;
  errorMessage: string | null;
  onMarkAllAsPresent: () => void;
};

export function CheckInSummaryCard({
  summary,
  helperText,
  allMembersPresent,
  isPending,
  errorMessage,
  onMarkAllAsPresent,
}: CheckInSummaryCardProps) {
  return (
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
            {countLabel(summary.visitorTotal, "visitante", "visitantes")}
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
          onClick={onMarkAllAsPresent}
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
  );
}
