import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Children, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { SignalBadgeTone } from "@/features/signals/display";
import type { PresenceTrend } from "@/features/events/presence-summary";

type CardPriorityTone = SignalBadgeTone | "stable" | "muted";

export function priorityCardClass(tone?: CardPriorityTone): string {
  if (tone === "risk") return "priority-card priority-card-risk";
  if (tone === "warn") return "priority-card priority-card-warn";
  if (tone === "support") return "priority-card priority-card-support";
  if (tone === "care") return "priority-card priority-card-care";
  if (tone === "stable") return "priority-card priority-card-stable";
  if (tone === "muted") return "priority-card priority-card-muted";
  return "";
}

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
      <p className="text-xl font-semibold leading-snug tracking-[-0.02em] text-[var(--color-text-primary)] text-balance">{title}</p>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{subtitle}</p> : null}
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
    ok: "text-[var(--color-metric-presenca)]",
    warn: "text-[var(--color-badge-atencao-text)]",
    risk: "text-[var(--color-metric-atencoes)]",
    neutral: "text-[var(--color-text-primary)]",
  };
  const trendToneClass = (trend: PresenceTrend, tone: "ok" | "warn" | "risk" | "neutral") => {
    if (trend.direction === "up") return "text-[var(--color-metric-presenca)]";
    if (tone === "ok") return "text-[var(--color-badge-atencao-text)]";
    return "text-[var(--color-metric-atencoes)]";
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
              <p className="context-summary-label font-semibold text-[var(--color-text-primary)]">{item.label}</p>
              {item.detail ? <p className={cn("context-summary-detail leading-relaxed", detailClass)}>{item.detail}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className={cn("context-summary-value font-bold tracking-[-0.02em]", toneClass[item.tone ?? "neutral"])}>
              {item.value}
              {item.trend && trendLayout === "inline" ? (
                <span
                  className={cn("ml-1 align-middle text-xs font-bold", trendToneClass(item.trend, item.tone ?? "neutral"))}
                  aria-label={`${item.trend.direction === "up" ? "subiu" : "caiu"} ${item.trend.delta} pontos em relação ao período anterior`}
                  title={`${item.trend.direction === "up" ? "Subiu" : "Caiu"} ${item.trend.delta} pontos em relação ao período anterior`}
                >
                  {item.trend.direction === "up" ? "↑" : "↓"} {item.trend.delta} pts
                </span>
              ) : null}
              </p>
              {item.trend && trendLayout === "stacked" ? (
                <p
                  className={cn("mt-1 text-[13px] font-bold leading-none", trendToneClass(item.trend, item.tone ?? "neutral"))}
                  aria-label={`${item.trend.direction === "up" ? "subiu" : "caiu"} ${item.trend.delta} pontos em relação ao período anterior`}
                  title={`${item.trend.direction === "up" ? "Subiu" : "Caiu"} ${item.trend.delta} pontos em relação ao período anterior`}
                >
                  {item.trend.direction === "up" ? "↑" : "↓"} {item.trend.delta} pts
                </p>
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
      <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{children}</h2>
      {detail ? <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{detail}</p> : null}
    </div>
  );
}

export function PastoralListSection({
  title,
  detail,
  children,
  hiddenChildren,
  emptyMessage,
  moreLabel = "Ver mais",
}: {
  title: ReactNode;
  detail?: string;
  children?: ReactNode;
  hiddenChildren?: ReactNode;
  emptyMessage?: string;
  moreLabel?: string;
}) {
  const hasChildren = Children.count(children) > 0;
  const hasHiddenChildren = Children.count(hiddenChildren) > 0;

  return (
    <section className="space-y-3">
      <SectionTitle detail={detail}>{title}</SectionTitle>
      {children}
      {hasHiddenChildren ? (
        <details className="group rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">{moreLabel}</span>
            <span className="hidden group-open:inline">Mostrar menos</span>
          </summary>
          <div className="mt-3 space-y-3">{hiddenChildren}</div>
        </details>
      ) : null}
      {!hasChildren && emptyMessage ? <EmptyState>{emptyMessage}</EmptyState> : null}
    </section>
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
      className="mb-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-[var(--color-brand)] transition active:scale-[0.98]"
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
    default: "border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[var(--color-text-secondary)]",
    success: "border-[var(--color-metric-presenca)]/25 bg-[var(--color-metric-presenca)]/8 text-[var(--color-metric-presenca)]",
    error: "border-[var(--color-metric-atencoes)]/25 bg-[var(--color-metric-atencoes)]/8 text-[var(--color-metric-atencoes)]",
    warning: "border-[var(--color-badge-atencao-text)]/25 bg-[var(--color-badge-atencao-text)]/8 text-[var(--color-badge-atencao-text)]",
  };

  const Icon = {
    default: Info,
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertCircle,
  }[tone];

  return (
    <div className={cn("mb-4 flex items-start gap-2.5 rounded-2xl border p-4 text-sm leading-relaxed shadow-card", toneStyles[tone])}>
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
    <p
      className={cn(
        "rounded-2xl border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)] text-sm leading-relaxed text-[var(--color-text-secondary)]",
        compact ? "px-3 py-2.5" : "p-3",
      )}
    >
      {children}
    </p>
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
  badgeTone?: SignalBadgeTone;
  actionLabel: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className={cn("block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]", priorityCardClass(badgeTone))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--color-text-primary)]">{title}</p>
          {meta ? <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{meta}</p> : null}
        </div>
        {badgeLabel ? <Badge tone={badgeTone}>{badgeLabel}</Badge> : null}
      </div>
      {children ? <div className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{children}</div> : null}
      <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">{actionLabel} →</p>
    </Link>
  );
}

export function PersonMiniCard({
  href,
  initials,
  name,
  context,
  badgeLabel,
  badgeTone = "neutral",
  cardTone,
  ctaLabel = "Abrir pessoa",
  compact = false,
}: {
  href: string;
  initials: string;
  name: string;
  context?: string;
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
  cardTone?: CardPriorityTone;
  ctaLabel?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={`${ctaLabel}: ${name}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card transition active:scale-[0.99]",
        compact ? "min-h-[3.75rem] px-3 py-2.5" : "min-h-[4.25rem] px-3 py-3",
        priorityCardClass(cardTone ?? badgeTone),
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] font-bold text-[var(--color-avatar-text)]",
            compact ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs",
          )}
        >
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</span>
          {context ? <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">{context}</span> : null}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badgeLabel ? <Badge tone={badgeTone} className={compact ? "px-2 py-0.5 text-[11px]" : undefined}>{badgeLabel}</Badge> : null}
        <span className="text-sm font-bold text-[var(--color-brand)] opacity-60 transition group-active:translate-x-0.5" aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}

export function PersonSignalCard({
  initials,
  name,
  context,
  reason,
  severity = "risk",
  badgeLabel,
  badgeTone,
  detailHref,
  href,
  ctaLabel = "Abrir pessoa",
}: {
  initials: string;
  name: string;
  context: string;
  reason?: string;
  severity?: "ok" | "warn" | "risk" | "info";
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
  detailHref?: string;
  href?: string;
  ctaLabel?: string;
}) {
  const resolvedBadgeTone = badgeTone ?? (severity === "risk" ? "risk" : severity === "ok" ? "ok" : severity === "info" ? "info" : "warn");
  const resolvedBadgeLabel = badgeLabel ?? (severity === "risk" ? "Urgente" : "Em atenção");
  const cardHref = detailHref ?? href;
  const priorityTone = resolvedBadgeTone === "neutral" || resolvedBadgeTone === "ok" || resolvedBadgeTone === "info"
    ? severity === "risk" ? "risk" : severity === "warn" ? "warn" : undefined
    : resolvedBadgeTone;

  const content = (
    <article className={cn("group rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card transition active:scale-[0.99]", priorityCardClass(priorityTone))}>
      <div className="flex items-start gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-xs font-bold text-[var(--color-avatar-text)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-text-secondary)]">{context}</p>
            </div>
            <Badge tone={resolvedBadgeTone} className="px-2 py-0.5 text-[11px]">{resolvedBadgeLabel}</Badge>
          </div>
          {reason ? <p className="mt-2 border-t border-[var(--color-border-divider)] pt-2 text-[13px] leading-relaxed text-[var(--color-text-primary)]">{reason}</p> : null}
          {cardHref ? (
            <p className="mt-2 text-[13px] font-semibold text-[var(--color-brand)]">
              {ctaLabel} <span className="inline-block transition group-active:translate-x-0.5">→</span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );

  return cardHref ? (
    <Link href={cardHref} aria-label={`${ctaLabel}: ${name}`} className="block">
      {content}
    </Link>
  ) : content;
}

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  attentionCount,
  href,
  hasPresenceData = true,
  noPresenceLabel = "Sem registro",
  attentionLabelKind = "default",
  badgeLabel,
  badgeTone,
  showBadge = true,
  cardTone,
  presenceTrend,
}: {
  name: string;
  subtitle: string;
  presenceRate: number;
  attentionCount: number;
  href?: string;
  hasPresenceData?: boolean;
  noPresenceLabel?: string;
  attentionLabelKind?: "default" | "local" | "pastoral";
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
  showBadge?: boolean;
  cardTone?: CardPriorityTone;
  presenceTrend?: PresenceTrend | null;
}) {
  const tone = !hasPresenceData ? "neutral" : presenceRate < 50 ? "risk" : presenceRate < 70 ? "warn" : "ok";
  const hasLowPresence = hasPresenceData && presenceRate < 70;
  const attentionLabel = attentionLabelKind === "pastoral"
    ? `${attentionCount} ${attentionCount === 1 ? "caso pastoral" : "casos pastorais"}`
    : attentionLabelKind === "local"
      ? `${attentionCount} ${attentionCount === 1 ? "atenção local" : "atenções locais"}`
      : `${attentionCount} ${attentionCount === 1 ? "pessoa em atenção" : "pessoas em atenção"}`;
  const fallbackBadgeTone: SignalBadgeTone = attentionCount > 0
    ? attentionLabelKind === "pastoral" ? "risk" : "warn"
    : !hasPresenceData ? "neutral" : tone === "risk" ? "risk" : hasLowPresence ? "warn" : "ok";
  const fallbackBadgeLabel = attentionCount > 0
    ? attentionLabel
    : !hasPresenceData ? noPresenceLabel : hasLowPresence ? "Presença baixa" : "Estável";
  const resolvedBadgeTone: SignalBadgeTone = badgeTone ?? fallbackBadgeTone;
  const resolvedBadgeLabel = badgeLabel ?? fallbackBadgeLabel;
  const priorityTone = cardTone ?? (resolvedBadgeTone === "neutral" || resolvedBadgeTone === "ok" || resolvedBadgeTone === "info" ? undefined : resolvedBadgeTone);
  const presenceText = hasPresenceData ? `${presenceRate}%` : "—";
  const presenceLabel = !hasPresenceData ? "Registro de presença" : presenceRate < 50 ? "Presença baixa" : "Presença recente";
  const presenceToneClass = !hasPresenceData
    ? "text-[var(--color-text-secondary)]"
    : tone === "risk"
      ? "text-[var(--color-metric-atencoes)]"
      : tone === "warn"
        ? "text-[var(--color-badge-atencao-text)]"
        : "text-[var(--color-metric-presenca)]";
  const content = (
    <article className={cn("rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card transition active:scale-[0.99]", priorityCardClass(priorityTone))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        {showBadge ? <Badge tone={resolvedBadgeTone}>{resolvedBadgeLabel}</Badge> : null}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--color-border-divider)] pt-2 text-xs text-[var(--color-text-secondary)]">
        <span className="min-w-0">
          {presenceLabel}:{" "}
          <strong className={cn("font-bold", presenceToneClass)}>{presenceText}</strong>
          {presenceTrend ? (
            <span
              className={cn("ml-1 font-bold", presenceTrend.direction === "up" ? "text-[var(--color-metric-presenca)]" : tone === "ok" ? "text-[var(--color-badge-atencao-text)]" : "text-[var(--color-metric-atencoes)]")}
              aria-label={`${presenceTrend.direction === "up" ? "subiu" : "caiu"} ${presenceTrend.delta} pontos em relação ao período anterior`}
              title={`${presenceTrend.direction === "up" ? "Subiu" : "Caiu"} ${presenceTrend.delta} pontos em relação ao período anterior`}
            >
              {presenceTrend.direction === "up" ? "↑" : "↓"} {presenceTrend.delta} pts
            </span>
          ) : null}
        </span>
        {href ? <span className="font-semibold text-[var(--color-brand)]">Abrir célula →</span> : null}
      </div>
    </article>
  );

  return href ? <Link href={href} className="block">{content}</Link> : content;
}
