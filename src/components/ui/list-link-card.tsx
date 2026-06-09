import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Badge, type BadgeMaxWidth, type BadgeShape, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { CardActionCue } from "@/components/ui/card-action-cue";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";
import styles from "./list-link-card.module.css";

type ListLinkCardSurface = "card" | "plain";
type ListLinkCardPrioritySurface = "default" | "accentStrip";
export type ListLinkCardTrailingStack = "none" | "narrow";

type ListLinkCardProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    title: ReactNode;
    subtitle?: ReactNode;
    leading?: ReactNode;
    badgeLabel?: ReactNode;
    badgeTone?: BadgeTone;
    badgeSize?: BadgeSize;
    badgeClassName?: string;
    badgeMaxWidth?: BadgeMaxWidth;
    badgeShape?: BadgeShape;
    badgeTruncate?: boolean;
    priorityTone?: CardPriorityTone;
    prioritySurface?: ListLinkCardPrioritySurface;
    compact?: boolean;
    surface?: ListLinkCardSurface;
    showArrow?: boolean;
    trailing?: ReactNode;
    titleClassName?: string;
    subtitleClassName?: string;
    leadingClassName?: string;
    textClassName?: string;
    trailingClassName?: string;
    arrowClassName?: string;
    trailingStack?: ListLinkCardTrailingStack;
  };

export function ListLinkCard({
  title,
  subtitle,
  leading,
  badgeLabel,
  badgeTone = "neutral",
  badgeSize,
  badgeClassName,
  badgeMaxWidth = "list",
  badgeShape,
  badgeTruncate,
  priorityTone,
  prioritySurface = "default",
  compact = false,
  surface = "card",
  showArrow = true,
  trailing,
  titleClassName,
  subtitleClassName,
  leadingClassName,
  textClassName,
  trailingClassName,
  arrowClassName,
  trailingStack = "none",
  className,
  ...props
}: ListLinkCardProps) {
  const stackTrailingOnNarrowMobile = trailingStack === "narrow";

  return (
    <Link
      className={cn(
        surface === "card" && [
          "card-hover-lift group relative isolate flex w-full max-w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card transition active:scale-[0.99]",
          stackTrailingOnNarrowMobile && styles.stackTrailingOnNarrowMobile,
          compact ? "min-h-[3.75rem] px-3 py-2.5" : "min-h-[4.25rem] px-3 py-3",
          priorityCardClass(priorityTone ?? badgeTone),
          prioritySurface === "accentStrip" && styles.accentStrip,
        ],
        className,
      )}
      {...props}
    >
      <span className={cn(
        "flex flex-1 items-center gap-3",
        styles.leading,
        leadingClassName,
      )}>
        {leading}
        <span className={cn("min-w-0 flex-1", textClassName)}>
          <span className={cn("k-item-title-sm block truncate", titleClassName)}>{title}</span>
          {subtitle ? <span className={cn("k-item-caption-truncate", subtitleClassName)}>{subtitle}</span> : null}
        </span>
      </span>
      <span
        className={cn(
          "flex max-w-[48%] shrink-0 items-center justify-end gap-2",
          styles.trailing,
          trailingClassName,
        )}
      >
        {badgeLabel ? (
          <Badge
            tone={badgeTone}
            size={badgeSize}
            maxWidth={badgeMaxWidth}
            shape={badgeShape}
            truncate={badgeTruncate}
            className={badgeClassName}
          >
            {badgeLabel}
          </Badge>
        ) : null}
        {trailing}
        {showArrow ? (
          <CardActionCue
            variant="icon"
            tone="neutral"
            enhanceOnGroupHover
            mobileCompact
            className={arrowClassName}
            aria-hidden="true"
          />
        ) : null}
      </span>
    </Link>
  );
}
