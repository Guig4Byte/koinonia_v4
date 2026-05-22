import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { PriorityCard } from "@/components/ui/priority-card";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import type { CardPriorityTone } from "@/lib/card-priority";
import { PresenceMetricDisplay, PresenceTrendDelta, type PresenceTrend } from "@/components/shared/presence-metric";
import { countLabel } from "@/lib/format";
import styles from "./group-card.module.css";

function groupAttentionLabel(count: number, kind: "default" | "local" | "pastoral") {
  if (kind === "pastoral") return countLabel(count, "caso pastoral", "casos pastorais");
  if (kind === "local") return countLabel(count, "atenção local", "atenções locais");
  return countLabel(count, "pessoa em atenção", "pessoas em atenção");
}

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  attentionCount,
  href,
  hasPresenceData = true,
  noPresenceLabel = "Sem registro",
  attentionLabelKind = "default",
  badgeLabel,
  badgeTone,
  showBadge = true,
  cardTone,
  presenceTrend,
}: {
  name: string;
  subtitle: string;
  presenceRate: number;
  attentionCount: number;
  href?: string;
  hasPresenceData?: boolean;
  noPresenceLabel?: string;
  attentionLabelKind?: "default" | "local" | "pastoral";
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  showBadge?: boolean;
  cardTone?: CardPriorityTone;
  presenceTrend?: PresenceTrend | null;
}) {
  const tone = presenceTone(hasPresenceData, presenceRate);
  const hasLowPresence = tone === "risk" || tone === "warn";
  const attentionLabel = groupAttentionLabel(attentionCount, attentionLabelKind);
  const fallbackBadgeTone: BadgeTone = attentionCount > 0
    ? attentionLabelKind === "pastoral" ? "risk" : "warn"
    : !hasPresenceData ? "neutral" : tone === "risk" ? "risk" : hasLowPresence ? "warn" : "ok";
  const fallbackBadgeLabel = attentionCount > 0
    ? attentionLabel
    : !hasPresenceData ? noPresenceLabel : hasLowPresence ? "Presença baixa" : "Estável";
  const resolvedBadgeTone: BadgeTone = badgeTone ?? fallbackBadgeTone;
  const resolvedBadgeLabel = badgeLabel ?? fallbackBadgeLabel;
  const priorityTone = cardTone ?? (resolvedBadgeTone === "neutral" || resolvedBadgeTone === "ok" || resolvedBadgeTone === "info" ? undefined : resolvedBadgeTone);
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
          badgeLabel={showBadge ? resolvedBadgeLabel : undefined}
          badgeTone={resolvedBadgeTone}
          badgeSize="sm"
          badgeShape="rounded"
          badgeMaxWidth="row"
          titleClassName={styles.title}
          subtitleClassName={styles.subtitle}
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

  return href ? <Link href={href} aria-label={`Abrir célula: ${name}`} className="block">{content}</Link> : content;
}
