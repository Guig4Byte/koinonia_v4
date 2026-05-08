import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { avatarColorForName, initials } from "@/lib/text";
import type { SignalBadgeTone } from "@/features/signals/display";
import { priorityCardClass, type CardPriorityTone } from "@/components/card-priority";

function Avatar({ name, compact = false }: { name: string; compact?: boolean }) {
  const colors = avatarColorForName(name);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        compact ? "h-8 w-8 text-[11px]" : "h-9 w-9 text-xs",
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {initials(name)}
    </span>
  );
}

function signalCardPriorityTone(resolvedBadgeTone: SignalBadgeTone, severity: "ok" | "warn" | "risk" | "info"): CardPriorityTone | undefined {
  if (resolvedBadgeTone !== "neutral" && resolvedBadgeTone !== "ok" && resolvedBadgeTone !== "info") {
    return resolvedBadgeTone;
  }

  if (severity === "risk") return "risk";
  if (severity === "warn") return "warn";
  return undefined;
}

export function PersonMiniCard(props: {
  href: string;
  name: string;
  context?: string;
  badgeLabel?: string;
  badgeTone?: SignalBadgeTone;
  cardTone?: CardPriorityTone;
  ctaLabel?: string;
  compact?: boolean;
}) {
  const {
    href,
    name,
    context,
    badgeLabel,
    badgeTone = "neutral",
    cardTone,
    ctaLabel = "Acompanhar",
    compact = false,
  } = props;
  return (
    <Link
      href={href}
      aria-label={`${ctaLabel}: ${name}`}
      className={cn(
        "card-hover-lift group flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card transition active:scale-[0.99]",
        compact ? "min-h-[3.75rem] px-3 py-2.5" : "min-h-[4.25rem] px-3 py-3",
        priorityCardClass(cardTone ?? badgeTone),
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={name} compact={compact} />
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

export function PersonSignalCard(props: {
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
  const {
    name,
    context,
    reason,
    severity = "risk",
    badgeLabel,
    badgeTone,
    detailHref,
    href,
    ctaLabel = "Acompanhar",
  } = props;
  const resolvedBadgeTone = badgeTone ?? (severity === "risk" ? "risk" : severity === "ok" ? "ok" : severity === "info" ? "info" : "warn");
  const resolvedBadgeLabel = badgeLabel ?? (severity === "risk" ? "Urgente" : "Em atenção");
  const cardHref = detailHref ?? href;
  const priorityTone = signalCardPriorityTone(resolvedBadgeTone, severity);

  const content = (
    <article className={cn("card-hover-lift group rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-3 shadow-card transition active:scale-[0.99]", priorityCardClass(priorityTone))}>
      <div className="flex items-start gap-2.5">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-text-primary)]">{name}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-[var(--color-text-secondary)]">{context}</p>
            </div>
            <Badge tone={resolvedBadgeTone} className="px-2 py-0.5 text-[11px]">{resolvedBadgeLabel}</Badge>
          </div>
          {reason ? <p className="mt-2 whitespace-pre-line border-t border-[var(--color-border-divider)] pt-2 text-[13px] leading-relaxed text-[var(--color-text-primary)]">{reason}</p> : null}
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
