import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { SignalBadgeTone } from "@/features/signals/display";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, presenceTone } from "@/features/events/presence-display";
import type { PresenceTrend } from "@/features/events/presence-summary";
import { priorityCardClass, type CardPriorityTone } from "@/components/card-priority";
import { metricTextClass, PresenceTrendDelta } from "@/components/presence-metric";
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
  badgeTone?: SignalBadgeTone;
  showBadge?: boolean;
  cardTone?: CardPriorityTone;
  presenceTrend?: PresenceTrend | null;
}) {
  const tone = presenceTone(hasPresenceData, presenceRate);
  const hasLowPresence = tone === "risk" || tone === "warn";
  const attentionLabel = groupAttentionLabel(attentionCount, attentionLabelKind);
  const fallbackBadgeTone: SignalBadgeTone = attentionCount > 0
    ? attentionLabelKind === "pastoral" ? "risk" : "warn"
    : !hasPresenceData ? "neutral" : tone === "risk" ? "risk" : hasLowPresence ? "warn" : "ok";
  const fallbackBadgeLabel = attentionCount > 0
    ? attentionLabel
    : !hasPresenceData ? noPresenceLabel : hasLowPresence ? "Presença baixa" : "Estável";
  const resolvedBadgeTone: SignalBadgeTone = badgeTone ?? fallbackBadgeTone;
  const resolvedBadgeLabel = badgeLabel ?? fallbackBadgeLabel;
  const priorityTone = cardTone ?? (resolvedBadgeTone === "neutral" || resolvedBadgeTone === "ok" || resolvedBadgeTone === "info" ? undefined : resolvedBadgeTone);
  const presenceText = hasPresenceData ? `${presenceRate}%` : "—";
  const presenceLabel = !hasPresenceData
    ? "Registro de presença"
    : presenceRate < DEFAULT_PRESENCE_TONE_THRESHOLDS.risk ? "Presença baixa" : "Presença recente";
  const presenceToneClass = metricTextClass(tone);
  const content = (
    <article className={cn("card-hover-lift rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card transition active:scale-[0.99]", priorityCardClass(priorityTone))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        {showBadge ? <Badge tone={resolvedBadgeTone}>{resolvedBadgeLabel}</Badge> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-divider)] pt-2 text-xs text-[var(--color-text-secondary)]">
        <span className="min-w-0">
          {presenceLabel}:{" "}
          <strong className={cn("font-bold", presenceToneClass)}>{presenceText}</strong>
          {presenceTrend ? (
            <PresenceTrendDelta trend={presenceTrend} tone={tone} className="ml-1" />
          ) : null}
        </span>
        {href ? <span className="font-semibold text-[var(--color-brand)]">Ver célula →</span> : null}
      </div>
    </article>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
