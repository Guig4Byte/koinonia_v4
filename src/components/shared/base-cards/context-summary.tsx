import { MetricRow, SummaryCard } from "@/components/ui/summary-card";
import {
  PresenceMetricDisplay,
  PresenceProgressDisplay,
  PresenceTrendDelta,
  type MetricTone,
  type PresenceIndicatorContext,
  type PresenceIndicatorMode,
  type PresenceIndicatorSize,
  type PresenceIndicatorWeight,
  type PresenceTrend,
} from "@/components/shared/presence-metric";

function parsePresenceMetricValue(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3})%$/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null;
}

export function ContextSummary({
  items,
  detailTone = "default",
  trendLayout = "inline",
  variant = "default",
  surface = "card",
  className,
  presenceContext = "overview",
  presenceLayout = "indicator",
  presenceMetricSize,
  presenceIndicatorWeight = "default",
  presenceIndicatorMode = "ring",
  presenceValueClassName,
}: {
  items: Array<{ label: string; value: string; detail?: string; tone?: MetricTone; trend?: PresenceTrend | null }>;
  detailTone?: "default" | "strong";
  trendLayout?: "inline" | "stacked";
  variant?: "default" | "compact" | "prominent" | "balanced";
  surface?: "card" | "inset";
  className?: string;
  presenceContext?: PresenceIndicatorContext;
  presenceLayout?: "indicator" | "progress";
  presenceMetricSize?: PresenceIndicatorSize;
  presenceIndicatorWeight?: PresenceIndicatorWeight;
  presenceIndicatorMode?: PresenceIndicatorMode;
  presenceValueClassName?: string;
}) {
  return (
    <SummaryCard variant={variant} surface={surface} className={className}>
      {items.map((item) => {
        const presenceRate = parsePresenceMetricValue(item.value);
        const normalizedLabel = item.label.trim().toLowerCase();
        const shouldUsePresenceIndicator = normalizedLabel === "presença" || normalizedLabel.startsWith("presença ");
        const tone = item.tone ?? "neutral";
        const resolvedPresenceMetricSize = presenceMetricSize ?? (variant === "balanced" || variant === "prominent" ? "md" : "sm");
        const presenceValueIsPlaceholder = item.value.trim() === "—" || item.value.trim() === "-";
        const presenceValue = presenceLayout === "progress" ? (
          <PresenceProgressDisplay
            hasPresenceData={presenceRate !== null}
            presenceRate={presenceRate ?? 0}
            tone={tone}
            value={item.value}
            context={presenceContext}
            size={resolvedPresenceMetricSize}
          />
        ) : (
          <PresenceMetricDisplay
            hasPresenceData={presenceRate !== null}
            presenceRate={presenceRate ?? 0}
            tone={tone}
            value={item.value}
            context={presenceContext}
            size={resolvedPresenceMetricSize}
            weight={presenceIndicatorWeight}
            mode={presenceIndicatorMode}
            valueClassName={presenceValueClassName}
            showValue={!presenceValueIsPlaceholder}
          />
        );

        return (
          <MetricRow
            key={item.label}
            label={item.label}
            detail={item.detail}
            value={shouldUsePresenceIndicator ? presenceValue : item.value}
            tone={tone}
            detailStrong={detailTone === "strong"}
            valueInlineAdornment={item.trend && trendLayout === "inline" ? (
              <PresenceTrendDelta
                trend={item.trend}
                tone={tone}
                className="ml-1 align-middle text-[length:var(--text-xs)]"
              />
            ) : null}
            valueStackedAdornment={item.trend && trendLayout === "stacked" ? (
              <PresenceTrendDelta
                trend={item.trend}
                tone={tone}
                className="mt-1 block text-[length:var(--text-sm)] leading-none"
              />
            ) : null}
          />
        );
      })}
    </SummaryCard>
  );
}
