"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { formatPresenceRate } from "@/features/events/presence-display";
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
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">Presença do encontro</p>
          <p className="text-3xl font-bold text-[var(--color-metric-presenca)]">{formatPresenceRate(summary.hasPresenceData, summary.presenceRate)}</p>
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
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={onMarkAllAsPresent}
          disabled={isPending}
          className="mt-4 text-xs"
        >
          Marcar todos como presentes
        </Button>
      ) : null}

      {summary.pending > 0 ? (
        <Feedback tone="warning" className="mt-4">
          <p className="font-semibold">
            {summary.pending === 1 ? "Falta marcar 1 pessoa." : `Falta marcar ${summary.pending} pessoas.`}
          </p>
          <p className="mt-1 text-xs leading-relaxed">Se todos vieram, use o atalho acima e ajuste só exceções.</p>
        </Feedback>
      ) : null}

      {errorMessage ? (
        <Feedback tone="error" ariaLive="polite" className="mt-4 font-medium">
          {errorMessage}
        </Feedback>
      ) : null}
    </Card>
  );
}
