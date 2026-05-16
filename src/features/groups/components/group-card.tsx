import Link from "next/link";
import type { BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { PriorityCard } from "@/components/ui/priority-card";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import type { CardPriorityTone } from "@/lib/card-priority";
import { PresenceMetricDisplay, PresenceTrendDelta, type PresenceTrend } from "@/components/shared/presence-metric";
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
  const content = (
    <PriorityCard priorityTone={priorityTone} padding="sm" interactive className="group">
      <CardHeader
        title={name}
        subtitle={subtitle}
        badgeLabel={showBadge ? resolvedBadgeLabel : undefined}
        badgeTone={resolvedBadgeTone}
      />
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-divider)] pt-2 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
        <span className="min-w-0">
          {presenceLabel}:{" "}
          <PresenceMetricDisplay
            hasPresenceData={hasPresenceData}
            presenceRate={presenceRate}
            tone={tone}
            value={presenceText}
            context="cell"
            size="sm"
          />
          {presenceTrend ? (
            <PresenceTrendDelta trend={presenceTrend} tone={tone} className="ml-1" />
          ) : null}
        </span>
        {href ? <span className="font-semibold text-[color:var(--color-brand)]">Abrir célula <span className="inline-block transition group-active:translate-x-0.5">→</span></span> : null}
      </div>
    </PriorityCard>
  );

  return href ? <Link href={href} aria-label={`Abrir célula: ${name}`} className="block">{content}</Link> : content;
}
