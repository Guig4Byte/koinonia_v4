import { cn } from "@/lib/cn";
import { presenceTrendLabel, presenceTrendValueLabel } from "./presence-metric-labels";
import { trendTextClass } from "./presence-metric.tokens";
import type { MetricTone, PresenceTrend } from "./presence-metric.types";

export function PresenceTrendDelta({
  trend,
  tone,
  className,
}: {
  trend: PresenceTrend;
  tone: MetricTone;
  className?: string;
}) {
  return (
    <span
      className={cn("font-bold", trendTextClass(trend, tone), className)}
      aria-label={presenceTrendLabel(trend)}
      title={presenceTrendLabel(trend, true)}
    >
      {trend.direction === "up" ? "↑" : "↓"} {presenceTrendValueLabel(trend.delta)}
    </span>
  );
}
