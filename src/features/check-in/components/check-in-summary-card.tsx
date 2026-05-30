"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, UserCheck, UserMinus, UsersRound, type LucideIcon } from "lucide-react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Feedback } from "@/components/ui/feedback";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
import { checkInMarkedLabel, type CheckInSummary } from "@/features/check-in/check-in-view";
import { countLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import styles from "./check-in-summary-card.module.css";

type CheckInSummaryCardProps = {
  summary: CheckInSummary;
  errorMessage: string | null;
  disabled?: boolean;
  onMarkAllPresent?: () => void;
};

type SummaryPillProps = {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: "present" | "justified" | "absent" | "pending";
};

const summaryPillToneClass: Record<SummaryPillProps["tone"], string> = {
  present: styles.summaryPillPresent,
  justified: styles.summaryPillJustified,
  absent: styles.summaryPillAbsent,
  pending: styles.summaryPillPending,
};

function SummaryPill({ icon: Icon, label, value, tone }: SummaryPillProps) {
  return (
    <div className={cn(styles.summaryPill, summaryPillToneClass[tone])}>
      <span className={styles.summaryPillIcon} aria-hidden="true">
        <Icon className={styles.summaryPillIconSvg} />
      </span>
      <span className={styles.summaryPillCopy}>
        <span className={styles.summaryPillValue}>{value}</span>
        <span className={styles.summaryPillLabel}>{label}</span>
      </span>
    </div>
  );
}

export function CheckInSummaryCard({ summary, errorMessage, disabled = false, onMarkAllPresent }: CheckInSummaryCardProps) {
  const [isConfirmingMarkAll, setIsConfirmingMarkAll] = useState(false);
  const canMarkAllPresent = summary.totalMembers > 0 && summary.present < summary.totalMembers && !disabled;

  function confirmMarkAllPresent() {
    onMarkAllPresent?.();
    setIsConfirmingMarkAll(false);
  }

  return (
    <Card tone="featured" className={styles.summaryCard}>
      <div className={styles.summaryTopRow}>
        <div className={styles.summaryRateBlock}>
          <p className={styles.summaryEyebrow}>Presença do encontro</p>
          <div data-testid="check-in-presence-rate">
            <PresenceMetricDisplay
              hasPresenceData={summary.hasPresenceData}
              presenceRate={summary.presenceRate}
              tone={presenceTone(summary.hasPresenceData, summary.presenceRate)}
              value={formatPresenceRate(summary.hasPresenceData, summary.presenceRate)}
              context="attendance"
              size="lg"
              weight="light"
              className={styles.summaryMetric}
            />
          </div>
          <p className={styles.summaryMeta}>
            {checkInMarkedLabel(summary)} · {countLabel(summary.visitorTotal, "visitante", "visitantes")}
          </p>
        </div>

        {onMarkAllPresent ? (
          <button
            type="button"
            className={styles.markAllButton}
            onClick={() => setIsConfirmingMarkAll(true)}
            disabled={!canMarkAllPresent}
          >
            <UsersRound className={styles.markAllIcon} aria-hidden="true" />
            <span className={styles.markAllText}>Marcar todos</span>
          </button>
        ) : null}
      </div>

      <div className={styles.summaryPillGrid}>
        <SummaryPill icon={CheckCircle2} label="Presentes" value={summary.present} tone="present" />
        <SummaryPill icon={UserCheck} label="Justificaram" value={summary.justified} tone="justified" />
        <SummaryPill icon={UserMinus} label="Ausentes" value={summary.absent} tone="absent" />
        <SummaryPill icon={Clock3} label="Sem marcação" value={summary.pending} tone="pending" />
      </div>

      {errorMessage ? (
        <Feedback tone="error" role="alert" ariaLive="assertive" className="mt-4 font-medium">
          {errorMessage}
        </Feedback>
      ) : null}

      {isConfirmingMarkAll ? (
        <BottomSheet
          onDismiss={() => setIsConfirmingMarkAll(false)}
          dismissLabel="Cancelar marcação de todos como presentes"
          tone="accent"
          size="sm"
          panelProps={{ role: "dialog", "aria-modal": true, "aria-labelledby": "mark-all-present-title" }}
        >
          <div className={styles.markAllSheet}>
            <div className={styles.markAllSheetHeader}>
              <span className={styles.markAllSheetIcon} aria-hidden="true">
                <UsersRound className={styles.markAllSheetIconSvg} />
              </span>
              <div>
                <h2 id="mark-all-present-title" className={styles.markAllSheetTitle}>Marcar todos como presentes?</h2>
                <p className={styles.markAllSheetDescription}>
                  Essa ação troca ausências, justificativas e irmãos sem marcação para presente neste encontro.
                </p>
              </div>
            </div>

            <div className={styles.markAllSheetActions}>
              <Button type="button" variant="secondary" shape="rounded" onClick={() => setIsConfirmingMarkAll(false)}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" shape="rounded" onClick={confirmMarkAllPresent} disabled={disabled}>
                Marcar presentes
              </Button>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </Card>
  );
}
