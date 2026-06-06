import Link from "next/link";
import type { BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { CardActionCue } from "@/components/ui/card-action-cue";
import { PriorityCard } from "@/components/ui/priority-card";
import type { CardPriorityTone } from "@/lib/card-priority";
import { PresenceMetricDisplay, PresenceTrendDelta, type PresenceTrend } from "@/components/shared/presence-metric";
import { buildGroupCardView } from "@/features/groups/group-card-view";
import styles from "./group-card.module.css";

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  href,
  hasPresenceData = true,
  recordedEventsCount,
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
  recordedEventsCount?: number;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  statusSummary?: string;
  cardTone?: CardPriorityTone;
  presenceTrend?: PresenceTrend | null;
}) {
  const view = buildGroupCardView({
    presenceRate,
    hasPresenceData,
    recordedEventsCount,
    badgeTone,
    cardTone,
  });
  const content = (
    <PriorityCard priorityTone={view.priorityTone} padding="none" interactive className={["group", styles.card].join(" ")}>
      <div className={styles.header}>
        <CardHeader
          title={name}
          subtitle={subtitle}
          badgeLabel={badgeLabel}
          badgeTone={badgeTone}
          badgeSize="sm"
          badgeShape="rounded"
          badgeMaxWidth="row"
          titleClassName={styles.title}
          subtitleClassName={styles.subtitle}
        />
        {statusSummary ? <div className={styles.statusSummary}>{statusSummary}</div> : null}
      </div>

      <div className={styles.footer}>
        <span className={styles.metricBlock}>
          <span className={styles.metricLabel}>{view.presenceLabel}</span>
          <span className={styles.metricValue}>
            <PresenceMetricDisplay
              hasPresenceData={hasPresenceData}
              presenceRate={presenceRate}
              tone={view.presenceTone}
              value={view.presenceText}
              context="cell"
              size="compact"
              minHeight="sm"
            />
            {presenceTrend ? (
              <PresenceTrendDelta trend={presenceTrend} tone={view.presenceTone} className={styles.trend} />
            ) : null}
          </span>
        </span>
        {href ? (
          <CardActionCue tone="decorative" size="md" mobileCompact>
            Abrir célula
          </CardActionCue>
        ) : null}
      </div>
    </PriorityCard>
  );

  return href ? <Link href={href} aria-label={`Abrir célula: ${name}`} className="block min-w-0 max-w-full">{content}</Link> : content;
}
