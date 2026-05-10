import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Info, Heart } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { priorityCardClass } from "@/lib/card-priority";
import { metricTextClass, PresenceTrendDelta, type PresenceTrend } from "@/components/presence-metric";

export function PulseCard({
  title,
  subtitle,
  tone = "calm",
}: {
  title: string;
  subtitle?: string;
  tone?: "calm" | "attention" | "ok";
}) {
  const accentClass = {
    calm: "bg-[var(--color-brand-accent)]",
    attention: "bg-[var(--color-metric-atencoes)]",
    ok: "bg-[var(--color-metric-presenca)]",
  }[tone];

  return (
    <section className="relative mb-4 overflow-hidden rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-5 shadow-card">
      <div className={cn("absolute inset-x-0 top-0 h-1", accentClass)} />
      <p className="text-[length:var(--text-xl)] font-semibold leading-snug tracking-[-0.02em] text-[color:var(--color-text-primary)] text-balance">{title}</p>
      {subtitle ? <p className="mt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{subtitle}</p> : null}
    </section>
  );
}

export function ContextSummary({
  items,
  detailTone = "default",
  trendLayout = "inline",
  variant = "default",
  surface = "card",
}: {
  items: Array<{ label: string; value: string; detail?: string; tone?: "ok" | "warn" | "risk" | "neutral"; trend?: PresenceTrend | null }>;
  detailTone?: "default" | "strong";
  trendLayout?: "inline" | "stacked";
  variant?: "default" | "compact" | "prominent" | "balanced";
  surface?: "card" | "inset";
}) {
  const toneClass = {
    ok: metricTextClass("ok"),
    warn: metricTextClass("warn"),
    risk: metricTextClass("risk"),
    neutral: "text-[color:var(--color-text-primary)]",
  };
  const detailClass = detailTone === "strong" ? "context-summary-detail-strong" : undefined;
  const surfaceClass = surface === "inset"
    ? "context-summary-inset border border-[var(--color-border-divider)] bg-[var(--metric-card-bg)] px-4 py-2 shadow-none"
    : "border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card";

  return (
    <section className={cn("context-summary mb-5 rounded-[1.15rem]", `context-summary-${variant}`, surfaceClass)}>
      <div className={surface === "inset" ? "space-y-0" : "space-y-3"}>
        {items.map((item) => (
          <div key={item.label} className="context-summary-row flex items-center justify-between gap-4 border-b border-[var(--color-border-divider)] pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <p className="context-summary-label k-item-title">{item.label}</p>
              {item.detail ? <p className={cn("context-summary-detail leading-relaxed", detailClass)}>{item.detail}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("context-summary-value font-bold tracking-[-0.02em]", toneClass[item.tone ?? "neutral"])}>
                {item.value}
              {item.trend && trendLayout === "inline" ? (
                <PresenceTrendDelta
                  trend={item.trend}
                  tone={item.tone ?? "neutral"}
                  className="ml-1 align-middle text-[length:var(--text-xs)]"
                />
              ) : null}
              </p>
              {item.trend && trendLayout === "stacked" ? (
                <PresenceTrendDelta
                  trend={item.trend}
                  tone={item.tone ?? "neutral"}
                  className="mt-1 block text-[length:var(--text-sm)] leading-none"
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SectionTitle({ children, detail }: { children: ReactNode; detail?: string }) {
  return (
    <div className="mb-2 mt-6">
      <h2 className="k-section-kicker">{children}</h2>
      {detail ? <p className="k-supporting-copy">{detail}</p> : null}
    </div>
  );
}

export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)] transition active:scale-[0.98]"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}

export function InfoCard({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "error" | "warning";
}) {
  const toneStyles = {
    default: "border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[color:var(--color-text-secondary)]",
    success: "border-[var(--color-metric-presenca)]/25 bg-[var(--color-metric-presenca)]/8 text-[color:var(--color-metric-presenca)]",
    error: "border-[var(--color-metric-atencoes)]/25 bg-[var(--color-metric-atencoes)]/8 text-[color:var(--color-metric-atencoes)]",
    warning: "border-[var(--color-badge-atencao-text)]/25 bg-[var(--color-badge-atencao-text)]/8 text-[color:var(--color-badge-atencao-text)]",
  };

  const Icon = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
  }[tone];

  return (
    <div className={cn("mb-4 flex items-start gap-2.5 rounded-2xl border p-4 text-[length:var(--text-sm)] leading-relaxed shadow-card", toneStyles[tone])}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function EmptyState({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-2xl border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]",
        compact ? "px-3 py-2.5" : "p-4",
      )}
    >
      <Heart className="h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function DetailLinkCard({
  href,
  title,
  meta,
  badgeLabel,
  badgeTone = "neutral",
  actionLabel,
  children,
}: {
  href: string;
  title: string;
  meta?: ReactNode;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  actionLabel: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className={cn("card-hover-lift block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]", priorityCardClass(badgeTone))}>
      <div className="k-card-header-row">
        <div className="min-w-0">
          <p className="k-item-title truncate">{title}</p>
          {meta ? <p className="k-supporting-copy">{meta}</p> : null}
        </div>
        {badgeLabel ? <Badge tone={badgeTone}>{badgeLabel}</Badge> : null}
      </div>
      {children ? <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{children}</div> : null}
      <p className="mt-3 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)]">{actionLabel} <span className="inline-block transition group-active:translate-x-0.5">→</span></p>
    </Link>
  );
}
