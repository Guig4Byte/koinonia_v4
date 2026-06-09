import { cn } from "@/lib/cn";
import { PresenceIndicator } from "./presence-indicator";
import {
  metricDisplayAlignClass,
  metricDisplayMinHeightClass,
  metricLabelSizeClass,
  metricTextClass,
} from "./presence-metric.tokens";
import type { PresenceMetricDisplayProps } from "./presence-metric.types";

export function PresenceMetricDisplay({
  hasPresenceData,
  presenceRate,
  tone,
  value,
  context = "overview",
  size = "md",
  weight = "default",
  mode = "ring",
  className,
  valueClassName,
  showValue = true,
  showValueInside = false,
  insideValueClassName,
  minHeight = "none",
  align = "end",
}: PresenceMetricDisplayProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 align-middle", metricDisplayAlignClass[align], metricDisplayMinHeightClass[minHeight], className)}>
      <PresenceIndicator
        hasPresenceData={hasPresenceData}
        presenceRate={presenceRate}
        tone={tone}
        context={context}
        size={size}
        value={value}
        showValueInside={showValueInside}
        insideValueClassName={insideValueClassName}
        weight={weight}
        mode={mode}
      />
      {showValue ? (
        <span className={cn("font-bold leading-none tabular-nums", metricLabelSizeClass[size], metricTextClass(tone), valueClassName)}>
          {value}
        </span>
      ) : null}
    </span>
  );
}
