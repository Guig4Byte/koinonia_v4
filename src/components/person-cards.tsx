import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { PriorityCard } from "@/components/ui/priority-card";
import { cn } from "@/lib/cn";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";

function signalCardPriorityTone(resolvedBadgeTone: BadgeTone, severity: "ok" | "warn" | "risk" | "info"): CardPriorityTone | undefined {
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
  badgeTone?: BadgeTone;
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
        <Avatar name={name} size={compact ? "sm" : "md"} />
        <span className="min-w-0">
          <span className="k-item-title-sm block truncate">{name}</span>
          {context ? <span className="k-item-caption-truncate">{context}</span> : null}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {badgeLabel ? <Badge tone={badgeTone} className={compact ? "max-w-[48%] px-2 py-0.5 text-[length:var(--text-xs)]" : "max-w-[48%]"}>{badgeLabel}</Badge> : null}
        <span className="text-[length:var(--text-sm)] font-bold text-[color:var(--color-brand)] opacity-60 transition group-active:translate-x-0.5" aria-hidden="true">
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
  badgeTone?: BadgeTone;
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
    <PriorityCard priorityTone={priorityTone} padding="sm" interactive className="group">
      <div className="flex items-start gap-2.5">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="k-item-title">{name}</p>
              <p className="mt-0.5 text-[length:var(--text-sm)] leading-snug text-[color:var(--color-text-secondary)]">{context}</p>
            </div>
            <Badge tone={resolvedBadgeTone} className="max-w-[48%] px-2 py-0.5 text-[length:var(--text-xs)]">{resolvedBadgeLabel}</Badge>
          </div>
          {reason ? <p className="mt-2 whitespace-pre-line border-t border-[var(--color-border-divider)] pt-2 text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-primary)]">{reason}</p> : null}
          {cardHref ? (
            <p className="mt-2 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)]">
              {ctaLabel} <span className="inline-block transition group-active:translate-x-0.5">→</span>
            </p>
          ) : null}
        </div>
      </div>
    </PriorityCard>
  );

  return cardHref ? (
    <Link href={cardHref} aria-label={`${ctaLabel}: ${name}`} className="block">
      {content}
    </Link>
  ) : content;
}
