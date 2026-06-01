import { cn } from "@/lib/cn";
import { PresenceContextGlyph } from "./presence-context-glyph";
import { clampPresenceRate, presenceMetricLabel } from "./presence-metric-labels";
import {
  indicatorIconSizeClass,
  indicatorSizeClass,
  indicatorValueSizeClass,
  plainIndicatorIconSizeClass,
  plainIndicatorWrapClass,
  presenceIndicatorStyle,
  presenceRingStrokeWidth,
} from "./presence-metric.tokens";
import type { PresenceIndicatorProps } from "./presence-metric.types";

export function PresenceIndicator({
  hasPresenceData,
  presenceRate,
  tone,
  context = "overview",
  size = "md",
  value,
  showValueInside = false,
  insideValueClassName,
  weight = "default",
  mode = "ring",
  className,
}: PresenceIndicatorProps) {
  const safeRate = hasPresenceData ? clampPresenceRate(presenceRate) : 0;
  const radius = 24;
  const ringStrokeWidth = presenceRingStrokeWidth(weight, showValueInside);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeRate / 100) * circumference;
  const label = presenceMetricLabel(context, hasPresenceData, presenceRate);
  const resolvedValue = value ?? (hasPresenceData ? `${safeRate}%` : "—");

  if (mode === "plain") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center align-middle text-[color:var(--presence-ring)]",
          plainIndicatorWrapClass[size],
          className,
        )}
        style={presenceIndicatorStyle(tone, hasPresenceData)}
        aria-label={label}
        title={label}
      >
        <PresenceContextGlyph context={context} className={plainIndicatorIconSizeClass[size]} />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full align-middle",
        indicatorSizeClass[size],
        className,
      )}
      style={presenceIndicatorStyle(tone, hasPresenceData)}
      aria-label={label}
      title={label}
    >
      <span
        className="absolute inset-0 rounded-full blur-md"
        style={{ background: "var(--presence-ring-glow)", opacity: hasPresenceData ? (weight === "light" ? 0.34 : 0.5) : 0 }}
        aria-hidden="true"
      />
      <svg viewBox="0 0 56 56" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true" focusable="false">
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="var(--presence-ring-bg)"
          stroke="var(--presence-ring-track)"
          strokeWidth={ringStrokeWidth}
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          fill="none"
          stroke="var(--presence-ring)"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          strokeWidth={ringStrokeWidth}
        />
      </svg>
      <span className={cn(
        "relative z-10 flex flex-col items-center justify-center text-center text-[color:var(--presence-ring)]",
        showValueInside ? "gap-0.5" : "gap-1",
      )}>
        <PresenceContextGlyph context={context} className={indicatorIconSizeClass[size]} />
        {showValueInside ? (
          <span className={cn("font-extrabold leading-none tracking-normal tabular-nums", indicatorValueSizeClass[size], insideValueClassName)}>
            {resolvedValue}
          </span>
        ) : null}
      </span>
    </span>
  );
}
