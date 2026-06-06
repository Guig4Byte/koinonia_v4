import type { ReactNode } from "react";
import { Heart, TrendingUp, UsersRound } from "lucide-react";
import {
  PresenceTrendDelta,
  metricTextClass,
  type MetricTone,
  type PresenceTrend,
} from "@/components/shared/presence-metric";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import styles from "./group-detail-summary-card.module.css";

function summaryValueTextClass(tone: MetricTone): string {
  return tone === "neutral" ? styles.valueNeutral : metricTextClass(tone);
}

export type GroupDetailSummaryCardData = {
  members: {
    count: number;
    detail: string;
  };
  presence: {
    hasPresenceData: boolean;
    value: string;
    detail: string;
    tone: MetricTone;
    trend: PresenceTrend | null;
  };
  attention: {
    label: string;
    count: number;
    detail: string;
    tone: MetricTone;
  };
};

function SummaryMetricRow({
  icon,
  label,
  detail,
  value,
  valueTone = "neutral",
  trend,
}: {
  icon: ReactNode;
  label: string;
  detail: string;
  value: ReactNode;
  valueTone?: MetricTone;
  trend?: PresenceTrend | null;
}) {
  return (
    <div className={styles.metricRow}>
      <span className={styles.iconWrap} aria-hidden="true">
        {icon}
      </span>
      <div className={styles.metricCopy}>
        <p className={styles.metricLabel}>{label}</p>
        <p className={styles.metricDetail}>{detail}</p>
      </div>
      <div className={styles.valueWrap}>
        <p className={cn(styles.metricValue, summaryValueTextClass(valueTone))}>
          {value}
        </p>
        {trend ? (
          <PresenceTrendDelta
            trend={trend}
            tone={valueTone}
            className={styles.trend}
          />
        ) : null}
      </div>
    </div>
  );
}

export function GroupDetailSummaryCard({ summary }: { summary: GroupDetailSummaryCardData }) {
  const presenceValue = summary.presence.hasPresenceData ? summary.presence.value : "Sem dados";
  const presenceTone = summary.presence.hasPresenceData ? summary.presence.tone : "neutral";

  return (
    <div className={styles.summaryCardWrapper}>
      <Card as="section" padding="summaryMetrics" radius="default" surface="accentHalo">
        <div className={styles.metricList}>
          <SummaryMetricRow
            icon={<UsersRound className={styles.icon} strokeWidth={2.35} absoluteStrokeWidth />}
            label="Membros acompanhados"
            detail={summary.members.detail}
            value={summary.members.count}
          />

          <SummaryMetricRow
            icon={<TrendingUp className={styles.icon} strokeWidth={2.35} absoluteStrokeWidth />}
            label="Presença recente"
            detail={summary.presence.detail}
            value={presenceValue}
            valueTone={presenceTone}
            trend={summary.presence.trend}
          />

          <SummaryMetricRow
            icon={<Heart className={styles.icon} strokeWidth={2.35} absoluteStrokeWidth />}
            label={summary.attention.label}
            detail={summary.attention.detail}
            value={summary.attention.count}
            valueTone={summary.attention.tone}
          />
        </div>
      </Card>
    </div>
  );
}
