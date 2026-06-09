import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Badge, type BadgeMaxWidth, type BadgeShape, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";
import styles from "./list-link-card.module.css";

type ListLinkCardSurface = "card" | "plain";
type ListLinkCardPrioritySurface = "default" | "accentStrip";

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
    stackTrailingOnMobile?: boolean;
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
  stackTrailingOnMobile = false,
  className,
  ...props
}: ListLinkCardProps) {
  return (
    <Link
      className={cn(
        surface === "card" && [
          "card-hover-lift group relative isolate flex w-full max-w-full min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card transition active:scale-[0.99]",
          stackTrailingOnMobile && "max-[430px]:flex-wrap max-[430px]:items-start",
          compact ? "min-h-[3.75rem] px-3 py-2.5" : "min-h-[4.25rem] px-3 py-3",
          priorityCardClass(priorityTone ?? badgeTone),
          prioritySurface === "accentStrip" && styles.accentStrip,
        ],
        className,
      )}
      {...props}
    >
      <span className={cn("flex min-w-0 flex-1 items-center gap-3", stackTrailingOnMobile && "max-[430px]:basis-full", leadingClassName)}>
        {leading}
        <span className={cn("min-w-0 flex-1", textClassName)}>
          <span className={cn("k-item-title-sm block truncate", titleClassName)}>{title}</span>
          {subtitle ? <span className={cn("k-item-caption-truncate", subtitleClassName)}>{subtitle}</span> : null}
        </span>
      </span>
      <span
        className={cn(
          "flex min-w-0 max-w-[48%] shrink-0 items-center justify-end gap-2",
          stackTrailingOnMobile && "max-[430px]:ml-[2.75rem] max-[430px]:mt-1 max-[430px]:basis-[calc(100%-2.75rem)] max-[430px]:max-w-[calc(100%-2.75rem)] max-[430px]:justify-between",
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
          <span className={cn("text-[length:var(--text-sm)] font-bold text-[color:var(--color-brand)] opacity-80 transition group-hover:opacity-100 group-active:translate-x-0.5", arrowClassName)} aria-hidden="true">
            →
          </span>
        ) : null}
      </span>
    </Link>
  );
}
