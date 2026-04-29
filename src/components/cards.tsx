import Link from "next/link";
import { Children, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import type { SignalBadgeTone } from "@/features/signals/display";

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
}: {
  items: Array<{ label: string; value: string; detail?: string; tone?: "ok" | "warn" | "risk" | "neutral" }>;
}) {
  const toneClass = {
    ok: "text-[var(--color-metric-presenca)]",
    warn: "text-[var(--color-badge-atencao-text)]",
    risk: "text-[var(--color-metric-atencoes)]",
    neutral: "text-[var(--color-text-primary)]",
  };

  return (
    <section className="mb-5 rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 border-b border-[var(--color-border-divider)] pb-3 last:border-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.label}</p>
              {item.detail ? <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{item.detail}</p> : null}
            </div>
            <p className={cn("shrink-0 text-xl font-bold tracking-[-0.02em]", toneClass[item.tone ?? "neutral"])}>{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MetricRow({ metrics }: { metrics: Array<{ label: string; value: string; tone?: "ok" | "warn" | "risk" | "neutral" }> }) {
  const toneClass = {
    ok: "text-[var(--color-metric-presenca)]",
    warn: "text-[var(--color-badge-atencao-text)]",
    risk: "text-[var(--color-metric-atencoes)]",
    neutral: "text-[var(--color-metric-visitantes)]",
  };

  return (
    <section className="mb-5 grid grid-cols-3 gap-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 text-center shadow-card">
          <p className={cn("text-2xl font-semibold", toneClass[metric.tone ?? "neutral"])}>{metric.value}</p>
          <p className="mt-1 text-[11px] font-medium text-[var(--color-text-secondary)]">{metric.label}</p>
        </div>
      ))}
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

export function ListMoreHint({ hiddenCount, label }: { hiddenCount: number; label: string }) {
  if (hiddenCount <= 0) return null;

  return (
    <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 text-sm leading-relaxed text-[var(--color-text-secondary)] shadow-card">
      Mais {hiddenCount} {hiddenCount === 1 ? "item" : "itens"}. {label}
    </p>
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
      {!hasChildren && emptyMessage ? (
        <p className="rounded-2xl border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  );
}

export function PersonMiniCard({
  href,
  initials,
  name,
  context,
  badgeLabel,
  badgeTone = "neutral",
  ctaLabel = "Abrir pessoa",
}: {
  href: string;
  initials: string;
  name: string;
  context?: string;
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
  ctaLabel?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={`${ctaLabel}: ${name}`}
      className="group flex min-h-[4.25rem] items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-3 shadow-card transition active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-xs font-bold text-[var(--color-avatar-text)]">
          {initials}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[var(--color-text-primary)]">{name}</span>
          {context ? <span className="mt-0.5 block truncate text-xs text-[var(--color-text-secondary)]">{context}</span> : null}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badgeLabel ? <Badge tone={badgeTone}>{badgeLabel}</Badge> : null}
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

  const content = (
    <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-avatar-bg)] text-sm font-bold text-[var(--color-avatar-text)]">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">{context}</p>
            </div>
            <Badge tone={resolvedBadgeTone}>{resolvedBadgeLabel}</Badge>
          </div>
          {reason ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{reason}</p> : null}
          {detailHref ? (
            <Link href={detailHref} className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]">
              {ctaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (!href || detailHref) return content;
  return <Link href={href}>{content}</Link>;
}

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  attentionCount,
  href,
  hasPresenceData = true,
  attentionLabelKind = "default",
  badgeLabel,
  badgeTone,
}: {
  name: string;
  subtitle: string;
  presenceRate: number;
  attentionCount: number;
  href?: string;
  hasPresenceData?: boolean;
  attentionLabelKind?: "default" | "local" | "pastoral";
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
}) {
  const tone = !hasPresenceData ? "neutral" : presenceRate < 65 ? "risk" : presenceRate < 75 ? "warn" : "ok";
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
    : !hasPresenceData ? "Sem registro" : hasLowPresence ? "Presença baixa" : "Estável";
  const resolvedBadgeTone: SignalBadgeTone = badgeTone ?? fallbackBadgeTone;
  const resolvedBadgeLabel = badgeLabel ?? fallbackBadgeLabel;
  const content = (
    <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        <Badge tone={resolvedBadgeTone}>{resolvedBadgeLabel}</Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-alt)]">
        <div
          className={cn("h-full rounded-full", tone === "risk" && "bg-[var(--color-metric-atencoes)]", tone === "warn" && "bg-[var(--color-badge-atencao-text)]", tone === "ok" && "bg-[var(--color-metric-presenca)]")}
          style={{ width: hasPresenceData ? `${presenceRate}%` : "0%" }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
        <span>
          Presença recente:{" "}
          <strong className="text-[var(--color-text-primary)]">{hasPresenceData ? `${presenceRate}%` : "Sem registro"}</strong>
        </span>
        {href ? <span className="font-semibold text-[var(--color-brand)]">Abrir célula →</span> : null}
      </div>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export function EventMacroCard({
  title,
  realized,
  planned,
  presenceRate,
  visitors,
  hasPresenceData = true,
}: {
  title: string;
  realized: number;
  planned: number;
  presenceRate: number;
  visitors: number;
  hasPresenceData?: boolean;
}) {
  return (
    <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl border border-[var(--metric-card-border)] bg-[var(--metric-card-bg)] p-3 shadow-[var(--metric-card-shadow)]">
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{realized}/{planned}</p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">realizadas</p>
        </div>
        <div className="rounded-2xl border border-[var(--metric-card-border)] bg-[var(--metric-card-bg)] p-3 shadow-[var(--metric-card-shadow)]">
          <p className="text-lg font-bold text-[var(--color-metric-presenca)]">
            {hasPresenceData ? `${presenceRate}%` : "—"}
          </p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">presença</p>
        </div>
        <div className="rounded-2xl border border-[var(--metric-card-border)] bg-[var(--metric-card-bg)] p-3 shadow-[var(--metric-card-shadow)]">
          <p className="text-lg font-bold text-[var(--color-metric-visitantes)]">{visitors}</p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">visitantes</p>
        </div>
      </div>
    </article>
  );
}
