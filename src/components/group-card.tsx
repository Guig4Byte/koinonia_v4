import Link from "next/link";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PriorityCard } from "@/components/ui/priority-card";
import { cn } from "@/lib/cn";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import type { CardPriorityTone } from "@/lib/card-priority";
import { metricTextClass, PresenceTrendDelta, type PresenceTrend } from "@/components/presence-metric";
import { countLabel } from "@/lib/format";

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
    ? "Registro de presença"
    : presenceRate < DEFAULT_PRESENCE_TONE_THRESHOLDS.risk ? "Presença baixa" : "Presença recente";
  const presenceToneClass = metricTextClass(tone);
  const content = (
    <PriorityCard priorityTone={priorityTone} padding="sm" interactive>
      <div className="k-card-header-row">
        <div>
          <p className="k-item-title">{name}</p>
          <p className="mt-0.5 text-[length:var(--text-sm)] text-[color:var(--color-text-secondary)]">{subtitle}</p>
        </div>
        {showBadge ? <Badge tone={resolvedBadgeTone} className="max-w-[48%]">{resolvedBadgeLabel}</Badge> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-divider)] pt-2 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
        <span className="min-w-0">
          {presenceLabel}:{" "}
          <strong className={cn("font-bold", presenceToneClass)}>{presenceText}</strong>
          {presenceTrend ? (
            <PresenceTrendDelta trend={presenceTrend} tone={tone} className="ml-1" />
          ) : null}
        </span>
        {href ? <span className="font-semibold text-[color:var(--color-brand)]">Ver célula →</span> : null}
      </div>
    </PriorityCard>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
