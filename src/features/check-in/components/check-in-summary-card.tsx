"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
import {
  checkInMarkedLabel,
  checkInPastoralSignalMessage,
  checkInPendingLabel,
  type CheckInSummary,
} from "@/features/check-in/check-in-view";
import { countLabel } from "@/lib/format";
import { cn } from "@/lib/cn";

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

type SummaryPillProps = {
  label: string;
  value: number;
  tone?: "default" | "present" | "justified" | "absent" | "pending";
};

const summaryPillToneClass: Record<NonNullable<SummaryPillProps["tone"]>, string> = {
  default: "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-secondary)]",
  present: "border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[color:var(--color-badge-estavel-text)]",
  justified: "border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[color:var(--color-badge-atencao-text)]",
  absent: "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[color:var(--color-badge-risco-text)]",
  pending: "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-muted)]",
};

function SummaryPill({ label, value, tone = "default" }: SummaryPillProps) {
  return (
    <div className={cn("rounded-2xl border px-3 py-2", summaryPillToneClass[tone])}>
      <p className="text-[length:var(--text-lg)] font-semibold leading-none">{value}</p>
      <p className="mt-1 text-[length:var(--text-xs)] font-medium leading-tight">{label}</p>
    </div>
  );
}

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
  const pastoralSignalMessage = checkInPastoralSignalMessage(summary);

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
              context="attendance"
              size="lg"
              weight="light"
            />
          </div>
          <p className="mt-1 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
            {checkInMarkedLabel(summary)}
            {" · "}
            {countLabel(summary.visitorTotal, "visitante", "visitantes")}
          </p>
        </div>
        <div className="rounded-full border border-[var(--color-border-card)] bg-[var(--surface-alt)] px-3 py-1 text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-secondary)]">
          {checkInPendingLabel(summary)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 min-[390px]:grid-cols-4">
        <SummaryPill label="Presentes" value={summary.present} tone="present" />
        <SummaryPill label="Justificaram" value={summary.justified} tone="justified" />
        <SummaryPill label="Ausentes" value={summary.absent} tone="absent" />
        <SummaryPill label="Pendentes" value={summary.pending} tone="pending" />
      </div>

      <p className="mt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{helperText}</p>

      {!allMembersPresent ? (
        <div className="mt-4 rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
          <div className="flex flex-col gap-3 min-[390px]:flex-row min-[390px]:items-center min-[390px]:justify-between">
            <div>
              <p className="text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-text-muted)]">
                Ação rápida
              </p>
              <p className="mt-1 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">
                Use quando todos os membros estiveram presentes.
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onMarkAllAsPresent}
              disabled={isPending || bulkConfirmationOpen}
              density="compact"
              responsiveWidth="fullUntilSm"
              className="shrink-0"
            >
              Marcar todos como presentes
            </Button>
          </div>
        </div>
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
        <Feedback tone="warning" compact className="mt-4" title="Marcações pendentes">
          <p>
            {summary.pending === 1 ? "Falta marcar 1 pessoa." : `Falta marcar ${summary.pending} pessoas.`}
          </p>
          <p className="mt-1 leading-relaxed">Se todos vieram, use o atalho acima e ajuste só exceções.</p>
        </Feedback>
      ) : null}

      {pastoralSignalMessage ? (
        <Feedback tone="info" compact className="mt-4" title="Olhar pastoral depois do encontro">
          <p>{pastoralSignalMessage}</p>
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
