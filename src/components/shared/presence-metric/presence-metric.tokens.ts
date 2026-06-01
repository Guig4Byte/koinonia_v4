import type {
  MetricTone,
  PresenceIndicatorSize,
  PresenceIndicatorStyle,
  PresenceIndicatorWeight,
  PresenceMetricDisplayAlign,
  PresenceMetricDisplayMinHeight,
  PresenceTrend,
} from "./presence-metric.types";

export function metricTextClass(tone: MetricTone): string {
  if (tone === "ok") return "text-[color:var(--color-metric-presenca)]";
  if (tone === "warn") return "text-[color:var(--color-badge-atencao-text)]";
  if (tone === "risk") return "text-[color:var(--color-metric-atencoes)]";
  if (tone === "warm") return "text-[color:var(--color-brand-accent)]";
  return "text-[color:var(--color-text-secondary)]";
}

export function trendTextClass(trend: PresenceTrend, tone: MetricTone): string {
  if (tone === "warm") return "text-[color:var(--color-brand-accent)]";
  if (trend.direction === "up") return "text-[color:var(--color-metric-presenca)]";
  if (tone === "ok") return "text-[color:var(--color-badge-atencao-text)]";
  return "text-[color:var(--color-metric-atencoes)]";
}

export const indicatorSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-7 w-7",
  compact: "h-9 w-9",
  md: "h-10 w-10",
  spotlight: "h-14 w-14",
  lg: "h-[4.25rem] w-[4.25rem]",
};

export const indicatorIconSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-3.5 w-3.5",
  compact: "h-4 w-4",
  md: "h-[1.125rem] w-[1.125rem]",
  spotlight: "h-5 w-5",
  lg: "h-5 w-5",
};

export const plainIndicatorWrapClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-5 w-5",
  compact: "h-5 w-5",
  md: "h-6 w-6",
  spotlight: "h-7 w-7",
  lg: "h-7 w-7",
};

export const plainIndicatorIconSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-4 w-4",
  compact: "h-4 w-4",
  md: "h-[1.125rem] w-[1.125rem]",
  spotlight: "h-5 w-5",
  lg: "h-5 w-5",
};

export const indicatorValueSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-xs)]",
  compact: "text-[length:var(--text-xs)]",
  md: "text-[length:var(--text-sm)]",
  spotlight: "text-[length:var(--text-sm)]",
  lg: "text-[length:var(--text-base)]",
};

export const metricLabelSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-xs)]",
  compact: "text-[length:var(--text-xs)]",
  md: "text-[length:var(--text-sm)]",
  spotlight: "text-[length:var(--text-lg)]",
  lg: "text-[length:var(--text-xl)]",
};

export const progressValueSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-sm)]",
  compact: "text-[length:var(--text-sm)]",
  md: "text-[length:var(--text-xl)]",
  spotlight: "text-[length:var(--text-xl)]",
  lg: "text-[length:var(--text-2xl)]",
};

export const progressBarWidthClass: Record<PresenceIndicatorSize, string> = {
  sm: "w-20",
  compact: "w-24",
  md: "w-28",
  spotlight: "w-32",
  lg: "w-36",
};

export const metricDisplayMinHeightClass = {
  none: "",
  sm: "min-h-8",
} satisfies Record<PresenceMetricDisplayMinHeight, string>;

export const metricDisplayAlignClass = {
  start: "justify-start",
  end: "justify-end",
} satisfies Record<PresenceMetricDisplayAlign, string>;

const presenceToneTokens = {
  ok: {
    ring: "var(--color-metric-presenca)",
    soft: "var(--color-badge-estavel-bg)",
    track: "color-mix(in srgb, var(--color-metric-presenca) 16%, var(--color-border-divider))",
    bg: "color-mix(in srgb, var(--color-metric-presenca) 10%, var(--color-bg-card))",
    glow: "color-mix(in srgb, var(--color-metric-presenca) 28%, transparent)",
  },
  warn: {
    ring: "var(--color-badge-atencao-text)",
    soft: "var(--color-badge-atencao-bg)",
    track: "color-mix(in srgb, var(--color-badge-atencao-text) 16%, var(--color-border-divider))",
    bg: "color-mix(in srgb, var(--color-badge-atencao-text) 10%, var(--color-bg-card))",
    glow: "color-mix(in srgb, var(--color-badge-atencao-text) 28%, transparent)",
  },
  risk: {
    ring: "var(--color-metric-atencoes)",
    soft: "var(--color-badge-risco-bg)",
    track: "color-mix(in srgb, var(--color-metric-atencoes) 16%, var(--color-border-divider))",
    bg: "color-mix(in srgb, var(--color-metric-atencoes) 10%, var(--color-bg-card))",
    glow: "color-mix(in srgb, var(--color-metric-atencoes) 28%, transparent)",
  },
  neutral: {
    ring: "var(--color-text-muted)",
    soft: "var(--surface-alt)",
    track: "color-mix(in srgb, var(--color-text-muted) 18%, var(--color-border-divider))",
    bg: "color-mix(in srgb, var(--color-text-muted) 8%, var(--color-bg-card))",
    glow: "transparent",
  },
  warm: {
    ring: "var(--brown-400)",
    soft: "color-mix(in srgb, var(--brown-400) 12%, var(--color-bg-card))",
    track: "color-mix(in srgb, var(--brown-400) 20%, var(--color-border-divider))",
    bg: "color-mix(in srgb, var(--brown-400) 10%, var(--color-bg-card))",
    glow: "color-mix(in srgb, var(--brown-400) 18%, transparent)",
  },
} satisfies Record<MetricTone, {
  ring: string;
  soft: string;
  track: string;
  bg: string;
  glow: string;
}>;

export function presenceIndicatorStyle(tone: MetricTone, hasPresenceData: boolean): PresenceIndicatorStyle {
  const base = hasPresenceData ? tone : "neutral";
  const selected = presenceToneTokens[base];

  return {
    "--presence-ring": selected.ring,
    "--presence-ring-soft": selected.soft,
    "--presence-ring-track": selected.track,
    "--presence-ring-bg": selected.bg,
    "--presence-ring-glow": selected.glow,
  };
}

export function presenceRingStrokeWidth(weight: PresenceIndicatorWeight, showValueInside: boolean): number {
  if (weight === "light") return showValueInside ? 2.6 : 3;
  return showValueInside ? 3.2 : 4;
}
