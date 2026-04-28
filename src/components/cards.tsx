import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CareActions } from "@/components/care-actions";
import { cn } from "@/lib/cn";

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

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">{children}</h2>;
}

export function PersonSignalCard({
  initials,
  name,
  context,
  reason,
  severity = "risk",
  detailHref,
  href,
  personId,
  phone,
  actionMode = "none",
  ctaLabel = "Abrir cuidado",
}: {
  initials: string;
  name: string;
  context: string;
  reason?: string;
  severity?: "ok" | "warn" | "risk" | "info";
  detailHref?: string;
  href?: string;
  personId?: string;
  phone?: string | null;
  actionMode?: "none" | "quick";
  ctaLabel?: string;
}) {
  const badgeTone = severity === "ok" ? "ok" : severity === "info" ? "info" : "warn";
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
            <Badge tone={badgeTone}>{severity === "risk" ? "atenção" : "olhar"}</Badge>
          </div>
          {reason ? <p className="mt-3 border-t border-[var(--color-border-divider)] pt-3 text-sm leading-relaxed text-[var(--color-text-primary)]">{reason}</p> : null}
          {detailHref ? (
            <Link href={detailHref} className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98]">
              {ctaLabel}
            </Link>
          ) : null}
          {actionMode === "quick" ? <CareActions personId={personId} phone={phone} /> : null}
        </div>
      </div>
    </article>
  );

  if (!href || detailHref || actionMode === "quick") return content;
  return <Link href={href}>{content}</Link>;
}

export function GroupCard({
  name,
  subtitle,
  presenceRate,
  attentionCount,
}: {
  name: string;
  subtitle: string;
  presenceRate: number;
  attentionCount: number;
}) {
  const tone = presenceRate < 65 ? "risk" : presenceRate < 75 ? "warn" : "ok";

  return (
    <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{subtitle}</p>
        </div>
        <Badge tone={attentionCount > 0 ? "warn" : "ok"}>{attentionCount > 0 ? `${attentionCount} ${attentionCount === 1 ? "atenção" : "atenções"}` : "estável"}</Badge>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-alt)]">
        <div
          className={cn("h-full rounded-full", tone === "risk" && "bg-[var(--color-metric-atencoes)]", tone === "warn" && "bg-[var(--color-badge-atencao-text)]", tone === "ok" && "bg-[var(--color-metric-presenca)]")}
          style={{ width: `${presenceRate}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-secondary)]">Presença média: <strong className="text-[var(--color-text-primary)]">{presenceRate}%</strong></p>
    </article>
  );
}

export function EventMacroCard({
  title,
  realized,
  planned,
  presenceRate,
  visitors,
}: {
  title: string;
  realized: number;
  planned: number;
  presenceRate: number;
  visitors: number;
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
          <p className="text-lg font-bold text-[var(--color-metric-presenca)]">{presenceRate}%</p>
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
