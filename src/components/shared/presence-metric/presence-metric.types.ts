import type { CSSProperties } from "react";

export type MetricTone = "ok" | "warn" | "risk" | "neutral" | "warm";

export type PresenceTrend = {
  direction: "up" | "down";
  delta: number;
};

export type PresenceIndicatorContext = "person" | "cell" | "event" | "attendance" | "overview";
export type PresenceIndicatorSize = "sm" | "compact" | "md" | "spotlight" | "lg";
export type PresenceIndicatorWeight = "default" | "light";
export type PresenceIndicatorMode = "ring" | "plain";

export type PresenceMetricDisplayMinHeight = "none" | "sm";
export type PresenceMetricDisplayAlign = "start" | "end";

export type PresenceIndicatorStyle = CSSProperties & {
  "--presence-ring": string;
  "--presence-ring-soft": string;
  "--presence-ring-track": string;
  "--presence-ring-bg": string;
  "--presence-ring-glow": string;
};

export type PresenceIndicatorProps = {
  hasPresenceData: boolean;
  presenceRate: number;
  tone: MetricTone;
  context?: PresenceIndicatorContext;
  size?: PresenceIndicatorSize;
  value?: string;
  showValueInside?: boolean;
  insideValueClassName?: string;
  weight?: PresenceIndicatorWeight;
  mode?: PresenceIndicatorMode;
  className?: string;
};

export type PresenceMetricDisplayProps = {
  hasPresenceData: boolean;
  presenceRate: number;
  tone: MetricTone;
  value: string;
  context?: PresenceIndicatorContext;
  size?: PresenceIndicatorSize;
  weight?: PresenceIndicatorWeight;
  mode?: PresenceIndicatorMode;
  className?: string;
  valueClassName?: string;
  showValue?: boolean;
  showValueInside?: boolean;
  insideValueClassName?: string;
  minHeight?: PresenceMetricDisplayMinHeight;
  align?: PresenceMetricDisplayAlign;
};

export type PresenceProgressDisplayProps = {
  hasPresenceData: boolean;
  presenceRate: number;
  tone: MetricTone;
  value: string;
  context?: PresenceIndicatorContext;
  size?: PresenceIndicatorSize;
  className?: string;
};
