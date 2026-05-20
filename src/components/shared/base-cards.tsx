import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Info, Heart } from "lucide-react";
import type { ReactNode } from "react";
import type { BadgeTone } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { CardLink } from "@/components/ui/card-link";
import { MetricRow, SummaryCard } from "@/components/ui/summary-card";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/cn";
import { PresenceMetricDisplay, PresenceProgressDisplay, PresenceTrendDelta, type MetricTone, type PresenceIndicatorContext, type PresenceIndicatorMode, type PresenceIndicatorSize, type PresenceIndicatorWeight, type PresenceTrend } from "@/components/shared/presence-metric";

export function PulseCard({
  title,
  subtitle,
  tone = "calm",
  className,
}: {
  title: string;
  subtitle?: string;
  tone?: "calm" | "attention" | "ok";
  className?: string;
}) {
  const toneStyles = {
    calm: {
      accentClass: "bg-[var(--color-brand-accent)]",
      surfaceStyle: undefined,
    },
    attention: {
      accentClass: "bg-[var(--color-metric-atencoes)]",
      surfaceStyle: {
        borderColor: "color-mix(in srgb, var(--color-metric-atencoes) 18%, var(--color-border-card) 82%)",
        background: "color-mix(in srgb, var(--color-bg-card) 97%, var(--color-metric-atencoes) 3%)",
      },
    },
    ok: {
      accentClass: "bg-[var(--color-metric-presenca)]",
      surfaceStyle: undefined,
    },
  }[tone];

  return (
    <section
      className={cn("relative isolate mb-4 overflow-hidden rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-4 py-3.5 shadow-card", className)}
      style={toneStyles.surfaceStyle}
    >
      <div className={cn("absolute inset-x-0 top-0 h-0.5", toneStyles.accentClass)} />
      <div
        className="pointer-events-none absolute -right-10 -top-16 -z-10 h-32 w-32 rounded-full"
        style={{ background: "color-mix(in srgb, var(--color-brand-accent) 12%, transparent)" }}
      />
      <p className="k-eyebrow mb-2">Radar pastoral</p>
      <p className="font-serif-display text-[length:var(--text-xl)] font-semibold leading-[1.12] tracking-normal text-[color:var(--color-text-primary)] text-balance">{title}</p>
      {subtitle ? <p className="mt-1.5 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{subtitle}</p> : null}
    </section>
  );
}

function parsePresenceMetricValue(value: string): number | null {
  const match = value.trim().match(/^(\d{1,3})%$/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : null;
}

export function ContextSummary({
  items,
  detailTone = "default",
  trendLayout = "inline",
  variant = "default",
  surface = "card",
  className,
  presenceContext = "overview",
  presenceLayout = "indicator",
  presenceMetricSize,
  presenceIndicatorWeight = "default",
  presenceIndicatorMode = "ring",
  presenceValueClassName,
}: {
  items: Array<{ label: string; value: string; detail?: string; tone?: MetricTone; trend?: PresenceTrend | null }>;
  detailTone?: "default" | "strong";
  trendLayout?: "inline" | "stacked";
  variant?: "default" | "compact" | "prominent" | "balanced";
  surface?: "card" | "inset";
  className?: string;
  presenceContext?: PresenceIndicatorContext;
  presenceLayout?: "indicator" | "progress";
  presenceMetricSize?: PresenceIndicatorSize;
  presenceIndicatorWeight?: PresenceIndicatorWeight;
  presenceIndicatorMode?: PresenceIndicatorMode;
  presenceValueClassName?: string;
}) {
  return (
    <SummaryCard variant={variant} surface={surface} className={className}>
      {items.map((item) => {
        const presenceRate = parsePresenceMetricValue(item.value);
        const normalizedLabel = item.label.trim().toLowerCase();
        const shouldUsePresenceIndicator = normalizedLabel === "presença" || normalizedLabel.startsWith("presença ");
        const tone = item.tone ?? "neutral";
        const resolvedPresenceMetricSize = presenceMetricSize ?? (variant === "balanced" || variant === "prominent" ? "md" : "sm");
        const presenceValueIsPlaceholder = item.value.trim() === "—" || item.value.trim() === "-";
        const presenceValue = presenceLayout === "progress" ? (
          <PresenceProgressDisplay
            hasPresenceData={presenceRate !== null}
            presenceRate={presenceRate ?? 0}
            tone={tone}
            value={item.value}
            context={presenceContext}
            size={resolvedPresenceMetricSize}
          />
        ) : (
          <PresenceMetricDisplay
            hasPresenceData={presenceRate !== null}
            presenceRate={presenceRate ?? 0}
            tone={tone}
            value={item.value}
            context={presenceContext}
            size={resolvedPresenceMetricSize}
            weight={presenceIndicatorWeight}
            mode={presenceIndicatorMode}
            valueClassName={presenceValueClassName}
            showValue={!presenceValueIsPlaceholder}
          />
        );

        return (
          <MetricRow
            key={item.label}
            label={item.label}
            detail={item.detail}
            value={shouldUsePresenceIndicator ? presenceValue : item.value}
            tone={tone}
            detailStrong={detailTone === "strong"}
            valueInlineAdornment={item.trend && trendLayout === "inline" ? (
              <PresenceTrendDelta
                trend={item.trend}
                tone={tone}
                className="ml-1 align-middle text-[length:var(--text-xs)]"
              />
            ) : null}
            valueStackedAdornment={item.trend && trendLayout === "stacked" ? (
              <PresenceTrendDelta
                trend={item.trend}
                tone={tone}
                className="mt-1 block text-[length:var(--text-sm)] leading-none"
              />
            ) : null}
          />
        );
      })}
    </SummaryCard>
  );
}


export function SectionTitle({ children, detail, className }: { children: ReactNode; detail?: string; className?: string }) {
  return <SectionHeader title={children} detail={detail} className={className} />;
}


export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mb-4 inline-flex min-h-12 items-center gap-2 rounded-2xl px-3 pr-4 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)] transition hover:bg-[var(--surface-alt)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]",
        className,
      )}
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
  className,
  compact = false,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]",
        compact ? "px-3 py-2.5" : "min-h-16 p-4",
        className,
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[color:var(--color-text-secondary)]",
          compact ? "mt-0.5 h-7 w-7" : "h-9 w-9",
        )}
        aria-hidden="true"
      >
        <Heart className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <div className="min-w-0 pt-0.5">
        {title ? <p className="font-semibold text-[color:var(--color-text-primary)]">{title}</p> : null}
        <p className={cn(title ? "mt-1" : undefined)}>{children}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
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
    <CardLink href={href} aria-label={`${actionLabel}: ${title}`} priorityTone={badgeTone}>
      <CardHeader
        title={title}
        subtitle={meta}
        badgeLabel={badgeLabel}
        badgeTone={badgeTone}
        titleClassName="truncate"
        subtitleClassName="k-supporting-copy"
      />
      {children ? <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">{children}</div> : null}
      <p className="mt-3 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)]">{actionLabel} <span className="inline-block transition group-active:translate-x-0.5">→</span></p>
    </CardLink>
  );
}
