import { cn } from "@/lib/cn";

export type MetricTone = "ok" | "warn" | "risk" | "neutral";

export type PresenceTrend = {
  direction: "up" | "down";
  delta: number;
};

export function metricTextClass(tone: MetricTone): string {
  if (tone === "ok") return "text-[var(--color-metric-presenca)]";
  if (tone === "warn") return "text-[var(--color-badge-atencao-text)]";
  if (tone === "risk") return "text-[var(--color-metric-atencoes)]";
  return "text-[var(--color-text-secondary)]";
}

function trendTextClass(trend: PresenceTrend, tone: MetricTone): string {
  if (trend.direction === "up") return "text-[var(--color-metric-presenca)]";
  if (tone === "ok") return "text-[var(--color-badge-atencao-text)]";
  return "text-[var(--color-metric-atencoes)]";
}

function presenceTrendLabel(trend: PresenceTrend, capitalized = false): string {
  const direction = trend.direction === "up"
    ? capitalized ? "Subiu" : "subiu"
    : capitalized ? "Caiu" : "caiu";

  return `${direction} ${trend.delta} pontos em relação ao período anterior`;
}

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
      {trend.direction === "up" ? "↑" : "↓"} {trend.delta} pts
    </span>
  );
}
