import { Avatar } from "@/components/ui/avatar";
import type { BadgeTone } from "@/components/ui/badge";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { ListLinkCard, type ListLinkCardTrailingStack } from "@/components/ui/list-link-card";
import type { CardPriorityTone } from "@/lib/card-priority";
import styles from "./person-cards.module.css";

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
  prioritySurface?: "default" | "accentStrip";
  ctaLabel?: string;
  compact?: boolean;
  trailingStack?: ListLinkCardTrailingStack;
  className?: string;
}) {
  const {
    href,
    name,
    context,
    badgeLabel,
    badgeTone = "neutral",
    cardTone,
    prioritySurface = "default",
    ctaLabel = "Acompanhar",
    compact = false,
    trailingStack = "none",
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
      prioritySurface={prioritySurface}
      compact={compact}
      trailingStack={trailingStack}
      subtitleClassName={styles.personMiniSubtitle}
      className={className}
    />
  );
}
