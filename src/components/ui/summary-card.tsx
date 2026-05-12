import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type MetricTone = "ok" | "warn" | "risk" | "neutral";
export type SummaryCardSurface = "card" | "inset";
export type SummaryCardVariant = "default" | "compact" | "prominent" | "balanced";

const metricToneClass: Record<MetricTone, string> = {
  ok: "text-[color:var(--color-metric-presenca)]",
  warn: "text-[color:var(--color-badge-atencao-text)]",
  risk: "text-[color:var(--color-metric-atencoes)]",
  neutral: "text-[color:var(--color-text-primary)]",
};

export function metricValueToneClass(tone: MetricTone = "neutral") {
  return metricToneClass[tone];
}

export function SummaryCard({
  variant = "default",
  surface = "card",
  className,
  children,
}: {
  variant?: SummaryCardVariant;
  surface?: SummaryCardSurface;
  className?: string;
  children: ReactNode;
}) {
  const surfaceClass = surface === "inset"
    ? "context-summary-inset border border-[var(--color-border-divider)] bg-[var(--metric-card-bg)] px-4 py-2 shadow-none"
    : "border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card";

  return (
    <section className={cn("context-summary mb-5 rounded-[1.15rem]", `context-summary-${variant}`, surfaceClass, className)}>
      <div className={surface === "inset" ? "space-y-0" : "space-y-3"}>{children}</div>
    </section>
  );
}

export function MetricRow({
  label,
  detail,
  value,
  tone = "neutral",
  detailStrong = false,
  valueInlineAdornment,
  valueStackedAdornment,
}: {
  label: ReactNode;
  detail?: ReactNode;
  value: ReactNode;
  tone?: MetricTone;
  detailStrong?: boolean;
  valueInlineAdornment?: ReactNode;
  valueStackedAdornment?: ReactNode;
}) {
  return (
    <div className="context-summary-row flex items-center justify-between gap-4 border-b border-[var(--color-border-divider)] pb-3 last:border-0 last:pb-0">
      <div className="min-w-0">
        <p className="context-summary-label k-item-title">{label}</p>
        {detail ? (
          <p className={cn("context-summary-detail leading-relaxed", detailStrong && "context-summary-detail-strong")}>
            {detail}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className={cn("context-summary-value font-bold tracking-[-0.02em]", metricValueToneClass(tone))}>
          {value}
          {valueInlineAdornment}
        </p>
        {valueStackedAdornment}
      </div>
    </div>
  );
}
