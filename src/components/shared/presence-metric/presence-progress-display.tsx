import { cn } from "@/lib/cn";
import { clampPresenceRate, presenceMetricLabel } from "./presence-metric-labels";
import {
  metricTextClass,
  presenceIndicatorStyle,
  progressBarWidthClass,
  progressValueSizeClass,
} from "./presence-metric.tokens";
import type { PresenceProgressDisplayProps } from "./presence-metric.types";

export function PresenceProgressDisplay({
  hasPresenceData,
  presenceRate,
  tone,
  value,
  context = "overview",
  size = "md",
  className,
}: PresenceProgressDisplayProps) {
  const safeRate = hasPresenceData ? clampPresenceRate(presenceRate) : 0;
  const label = presenceMetricLabel(context, hasPresenceData, presenceRate);
  const displayValue = hasPresenceData ? value : "Sem dados";

  return (
    <span
      className={cn("inline-flex min-w-0 flex-col items-end gap-1.5 align-middle", className)}
      style={presenceIndicatorStyle(tone, hasPresenceData)}
      aria-label={label}
      title={label}
    >
      <span
        className={cn(
          "font-extrabold leading-none tracking-[-0.02em] tabular-nums",
          hasPresenceData ? metricTextClass(tone) : "text-[color:var(--color-text-muted)]",
          hasPresenceData ? progressValueSizeClass[size] : "text-[length:var(--text-xs)] font-bold uppercase tracking-[0.08em]",
        )}
      >
        {displayValue}
      </span>
      {hasPresenceData ? (
        <span
          className={cn("block h-1.5 overflow-hidden rounded-full", progressBarWidthClass[size])}
          style={{ background: "var(--presence-ring-track)" }}
          aria-hidden="true"
        >
          <span
            className="block h-full rounded-full"
            style={{ width: `${safeRate}%`, background: "var(--presence-ring)" }}
          />
        </span>
      ) : null}
    </span>
  );
}
