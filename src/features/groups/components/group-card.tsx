import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { PriorityCard } from "@/components/ui/priority-card";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import type { CardPriorityTone } from "@/lib/card-priority";
import { PresenceMetricDisplay, PresenceTrendDelta, type PresenceTrend } from "@/components/shared/presence-metric";
import styles from "./group-card.module.css";

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  href,
  hasPresenceData = true,
  badgeLabel,
  badgeTone,
  statusSummary,
  cardTone,
  presenceTrend,
}: {
  name: string;
  subtitle: string;
  presenceRate: number;
  href?: string;
  hasPresenceData?: boolean;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  statusSummary?: string;
  cardTone?: CardPriorityTone;
  presenceTrend?: PresenceTrend | null;
}) {
  const tone = presenceTone(hasPresenceData, presenceRate);
  const priorityTone = cardTone ?? (!badgeTone || badgeTone === "neutral" || badgeTone === "ok" || badgeTone === "info" ? undefined : badgeTone);
  const presenceText = formatPresenceRate(hasPresenceData, presenceRate);
  const presenceLabel = !hasPresenceData
    ? "Sem presença recente"
    : presenceRate < DEFAULT_PRESENCE_TONE_THRESHOLDS.risk ? "Presença baixa" : "Presença recente";
  const content = (
    <PriorityCard priorityTone={priorityTone} padding="none" interactive className={["group", styles.card].join(" ")}>
      <div className={styles.header}>
        <CardHeader
          title={name}
          subtitle={subtitle}
          detail={statusSummary}
          badgeLabel={badgeLabel}
          badgeTone={badgeTone}
          badgeSize="sm"
          badgeShape="rounded"
          badgeMaxWidth="row"
          titleClassName={styles.title}
          subtitleClassName={styles.subtitle}
          detailClassName={styles.statusSummary}
        />
      </div>

      <div className={styles.footer}>
        <span className={styles.metricBlock}>
          <span className={styles.metricLabel}>{presenceLabel}</span>
          <span className={styles.metricValue}>
            <PresenceMetricDisplay
              hasPresenceData={hasPresenceData}
              presenceRate={presenceRate}
              tone={tone}
              value={presenceText}
              context="cell"
              size="compact"
              minHeight="sm"
            />
            {presenceTrend ? (
              <PresenceTrendDelta trend={presenceTrend} tone={tone} className={styles.trend} />
            ) : null}
          </span>
        </span>
        {href ? (
          <span className={styles.action}>
            Abrir célula
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.35} aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </PriorityCard>
  );

  return href ? <Link href={href} aria-label={`Abrir célula: ${name}`} className="block min-w-0 max-w-full">{content}</Link> : content;
}
