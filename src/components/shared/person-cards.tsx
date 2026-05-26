import { Avatar } from "@/components/ui/avatar";
import type { BadgeTone } from "@/components/ui/badge";
import { SignalHeartIndicator } from "@/components/ui/signal-heart-indicator";
import { ListLinkCard } from "@/components/ui/list-link-card";
import type { CardPriorityTone } from "@/lib/card-priority";

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
  return (
    <ListLinkCard
      href={href}
      aria-label={`${ctaLabel}: ${name}`}
      title={name}
      subtitle={context}
      leading={<Avatar name={name} size={compact ? "sm" : "md"} />}
      trailing={badgeLabel ? <SignalHeartIndicator tone={badgeTone} size={compact ? "sm" : "md"} label={badgeLabel} /> : undefined}
      priorityTone={cardTone ?? badgeTone}
      compact={compact}
      className={className}
    />
  );
}
