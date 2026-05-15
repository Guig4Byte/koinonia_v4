"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
import { countLabel } from "@/lib/format";
import type { CheckInSummary } from "@/features/check-in/check-in-view";

type CheckInSummaryCardProps = {
  summary: CheckInSummary;
  helperText: string;
  allMembersPresent: boolean;
  isPending: boolean;
  bulkConfirmationOpen: boolean;
  errorMessage: string | null;
  onCancelMarkAllAsPresent: () => void;
  onConfirmMarkAllAsPresent: () => void;
  onMarkAllAsPresent: () => void;
};

export function CheckInSummaryCard({
  summary,
  helperText,
  allMembersPresent,
  isPending,
  bulkConfirmationOpen,
  errorMessage,
  onCancelMarkAllAsPresent,
  onConfirmMarkAllAsPresent,
  onMarkAllAsPresent,
}: CheckInSummaryCardProps) {
  return (
    <Card tone="featured">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">Presença do encontro</p>
          <div data-testid="check-in-presence-rate">
            <PresenceMetricDisplay
              hasPresenceData={summary.hasPresenceData}
              presenceRate={summary.presenceRate}
              tone={presenceTone(summary.hasPresenceData, summary.presenceRate)}
              value={formatPresenceRate(summary.hasPresenceData, summary.presenceRate)}
              context="event"
              size="lg"
              showValue={false}
              showValueInside
            />
          </div>
          <p className="mt-1 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
            {summary.pending > 0
              ? `${summary.totalMembers - summary.pending} de ${summary.totalMembers} marcados`
              : `${summary.present} de ${summary.totalMembers} presentes`}
            {" · "}
            {countLabel(summary.visitorTotal, "visitante", "visitantes")}
          </p>
        </div>
        <div className="rounded-full border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-1 text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">
          {summary.pending > 0 ? `Faltam ${summary.pending}` : "Tudo marcado"}
        </div>
      </div>

      <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{helperText}</p>

      {!allMembersPresent ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          fullWidth
          onClick={onMarkAllAsPresent}
          disabled={isPending || bulkConfirmationOpen}
          className="mt-4 text-[length:var(--text-xs)]"
        >
          Marcar todos como presentes
        </Button>
      ) : null}

      {bulkConfirmationOpen ? (
        <Feedback
          tone="warning"
          role="alert"
          ariaLive="assertive"
          className="mt-4"
          title="Substituir marcações?"
        >
          <p>
            Isso vai trocar ausentes e justificativas para presentes. Use apenas se a célula inteira esteve presente.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onCancelMarkAllAsPresent}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="attentionSoft"
              size="sm"
              onClick={onConfirmMarkAllAsPresent}
              disabled={isPending}
            >
              Sim, marcar todos
            </Button>
          </div>
        </Feedback>
      ) : null}

      {summary.pending > 0 ? (
        <Feedback tone="warning" className="mt-4">
          <p className="font-semibold">
            {summary.pending === 1 ? "Falta marcar 1 pessoa." : `Falta marcar ${summary.pending} pessoas.`}
          </p>
          <p className="mt-1 text-[length:var(--text-xs)] leading-relaxed">Se todos vieram, use o atalho acima e ajuste só exceções.</p>
        </Feedback>
      ) : null}

      {errorMessage ? (
        <Feedback tone="error" role="alert" ariaLive="assertive" className="mt-4 font-medium">
          {errorMessage}
        </Feedback>
      ) : null}
    </Card>
  );
}
