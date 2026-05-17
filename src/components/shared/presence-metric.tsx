import type { CSSProperties } from "react";
import { CalendarCheck2, ChartNoAxesCombined, UserRoundCheck, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type MetricTone = "ok" | "warn" | "risk" | "neutral";

export type PresenceTrend = {
  direction: "up" | "down";
  delta: number;
};

export type PresenceIndicatorContext = "person" | "cell" | "event" | "attendance" | "overview";
export type PresenceIndicatorSize = "sm" | "compact" | "md" | "spotlight" | "lg";
export type PresenceIndicatorWeight = "default" | "light";
export type PresenceIndicatorMode = "ring" | "plain";

export function metricTextClass(tone: MetricTone): string {
  if (tone === "ok") return "text-[color:var(--color-metric-presenca)]";
  if (tone === "warn") return "text-[color:var(--color-badge-atencao-text)]";
  if (tone === "risk") return "text-[color:var(--color-metric-atencoes)]";
  return "text-[color:var(--color-text-secondary)]";
}

function trendTextClass(trend: PresenceTrend, tone: MetricTone): string {
  if (trend.direction === "up") return "text-[color:var(--color-metric-presenca)]";
  if (tone === "ok") return "text-[color:var(--color-badge-atencao-text)]";
  return "text-[color:var(--color-metric-atencoes)]";
}

function presenceTrendValueLabel(delta: number): string {
  return `${delta} ${delta === 1 ? "ponto" : "pontos"}`;
}

function presenceTrendLabel(trend: PresenceTrend, capitalized = false): string {
  const direction = trend.direction === "up"
    ? capitalized ? "Subiu" : "subiu"
    : capitalized ? "Caiu" : "caiu";

  return `${direction} ${presenceTrendValueLabel(trend.delta)} em relação ao período anterior`;
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
      {trend.direction === "up" ? "↑" : "↓"} {presenceTrendValueLabel(trend.delta)}
    </span>
  );
}

const indicatorSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-7 w-7",
  compact: "h-9 w-9",
  md: "h-10 w-10",
  spotlight: "h-14 w-14",
  lg: "h-[4.25rem] w-[4.25rem]",
};

const indicatorIconSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-3.5 w-3.5",
  compact: "h-4 w-4",
  md: "h-[1.125rem] w-[1.125rem]",
  spotlight: "h-5 w-5",
  lg: "h-5 w-5",
};

const plainIndicatorWrapClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-5 w-5",
  compact: "h-5 w-5",
  md: "h-6 w-6",
  spotlight: "h-7 w-7",
  lg: "h-7 w-7",
};

const plainIndicatorIconSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "h-4 w-4",
  compact: "h-4 w-4",
  md: "h-[1.125rem] w-[1.125rem]",
  spotlight: "h-5 w-5",
  lg: "h-5 w-5",
};

const indicatorValueSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-xs)]",
  compact: "text-[length:var(--text-xs)]",
  md: "text-[length:var(--text-sm)]",
  spotlight: "text-[length:var(--text-sm)]",
  lg: "text-[length:var(--text-base)]",
};

const metricLabelSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-xs)]",
  compact: "text-[length:var(--text-xs)]",
  md: "text-[length:var(--text-sm)]",
  spotlight: "text-[length:var(--text-lg)]",
  lg: "text-[length:var(--text-xl)]",
};

const progressValueSizeClass: Record<PresenceIndicatorSize, string> = {
  sm: "text-[length:var(--text-sm)]",
  compact: "text-[length:var(--text-sm)]",
  md: "text-[length:var(--text-xl)]",
  spotlight: "text-[length:var(--text-xl)]",
  lg: "text-[length:var(--text-2xl)]",
};

const progressBarWidthClass: Record<PresenceIndicatorSize, string> = {
  sm: "w-20",
  compact: "w-24",
  md: "w-28",
  spotlight: "w-32",
  lg: "w-36",
};

const presenceContextIcon: Record<PresenceIndicatorContext, LucideIcon> = {
  person: UserRoundCheck,
  cell: UsersRound,
  event: CalendarCheck2,
  attendance: UsersRound,
  overview: ChartNoAxesCombined,
};

type PresenceIndicatorStyle = CSSProperties & {
  "--presence-ring": string;
  "--presence-ring-soft": string;
  "--presence-ring-track": string;
  "--presence-ring-bg": string;
  "--presence-ring-glow": string;
};

export function presenceIndicatorStyle(tone: MetricTone, hasPresenceData: boolean): PresenceIndicatorStyle {
  const base = hasPresenceData ? tone : "neutral";

  const tokens = {
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
  } satisfies Record<MetricTone, {
    ring: string;
    soft: string;
    track: string;
    bg: string;
    glow: string;
  }>;

  const selected = tokens[base];

  return {
    "--presence-ring": selected.ring,
    "--presence-ring-soft": selected.soft,
    "--presence-ring-track": selected.track,
    "--presence-ring-bg": selected.bg,
    "--presence-ring-glow": selected.glow,
  };
}

export function clampPresenceRate(presenceRate: number): number {
  if (!Number.isFinite(presenceRate)) return 0;
  return Math.min(100, Math.max(0, Math.round(presenceRate)));
}

function metricLabel(context: PresenceIndicatorContext, hasPresenceData: boolean, presenceRate: number): string {
  const subject = {
    person: "da pessoa",
    cell: "da célula",
    event: "do encontro",
    attendance: "do encontro",
    overview: "geral",
  }[context];

  return hasPresenceData
    ? `Presença ${subject}: ${clampPresenceRate(presenceRate)}%`
    : `Presença ${subject}: sem registro`;
}

function PresenceContextGlyph({ context, className }: { context: PresenceIndicatorContext; className?: string }) {
  const Icon = presenceContextIcon[context];
  return (
    <Icon
      className={className}
      strokeWidth={2.35}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
    />
  );
}

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
}: {
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
}) {
  const safeRate = hasPresenceData ? clampPresenceRate(presenceRate) : 0;
  const radius = 24;
  const ringStrokeWidth = weight === "light"
  ? (showValueInside ? 2.6 : 3)
  : (showValueInside ? 3.2 : 4);
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeRate / 100) * circumference;
  const label = metricLabel(context, hasPresenceData, presenceRate);
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
}: {
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
}) {
  return (
    <span className={cn("inline-flex items-center justify-end gap-1.5 align-middle", className)}>
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

export function PresenceProgressDisplay({
  hasPresenceData,
  presenceRate,
  tone,
  value,
  context = "overview",
  size = "md",
  className,
}: {
  hasPresenceData: boolean;
  presenceRate: number;
  tone: MetricTone;
  value: string;
  context?: PresenceIndicatorContext;
  size?: PresenceIndicatorSize;
  className?: string;
}) {
  const safeRate = hasPresenceData ? clampPresenceRate(presenceRate) : 0;
  const label = metricLabel(context, hasPresenceData, presenceRate);
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
