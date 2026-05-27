import { Avatar } from "@/components/ui/avatar";
import type { BadgeTone } from "@/components/ui/badge";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { ListLinkCard } from "@/components/ui/list-link-card";
import type { CardPriorityTone } from "@/lib/card-priority";

function comparableCopy(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function contextWithoutRepeatedBadge(context: string | undefined, badgeLabel: string | undefined) {
  const cleanContext = context?.trim();
  const cleanBadge = badgeLabel?.trim();

  if (!cleanContext || !cleanBadge) return cleanContext;

  const comparableBadge = comparableCopy(cleanBadge);
  const contextParts = cleanContext
    .split("·")
    .map((part) => part.trim())
    .filter((part) => comparableCopy(part) !== comparableBadge);

  if (contextParts.length === 0) return undefined;

  return contextParts.join(" · ");
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
  className?: string;
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
    className,
  } = props;
  const subtitle = contextWithoutRepeatedBadge(context, badgeLabel);

  return (
    <ListLinkCard
      href={href}
      aria-label={`${ctaLabel}: ${name}`}
      title={name}
      subtitle={subtitle}
      leading={<Avatar name={name} size={compact ? "sm" : "md"} />}
      trailing={badgeLabel ? <SignalHeartIndicator tone={badgeTone} size={compact ? "sm" : "md"} label={badgeLabel} showLabel={!compact} /> : undefined}
      priorityTone={cardTone ?? badgeTone}
      compact={compact}
      className={className}
    />
  );
}
