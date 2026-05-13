import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Badge, type BadgeSize, type BadgeTone } from "@/components/ui/badge";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";

type ListLinkCardSurface = "card" | "plain";

type ListLinkCardProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
    title: ReactNode;
    subtitle?: ReactNode;
    leading?: ReactNode;
    badgeLabel?: ReactNode;
    badgeTone?: BadgeTone;
    badgeSize?: BadgeSize;
    badgeClassName?: string;
    priorityTone?: CardPriorityTone;
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
  };

export function ListLinkCard({
  title,
  subtitle,
  leading,
  badgeLabel,
  badgeTone = "neutral",
  badgeSize,
  badgeClassName,
  priorityTone,
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
  className,
  ...props
}: ListLinkCardProps) {
  return (
    <Link
      className={cn(
        surface === "card" && [
          "card-hover-lift group relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card transition active:scale-[0.99]",
          compact ? "min-h-[3.75rem] px-3 py-2.5" : "min-h-[4.25rem] px-3 py-3",
          priorityCardClass(priorityTone ?? badgeTone),
        ],
        className,
      )}
      {...props}
    >
      <span className={cn("flex min-w-0 items-center gap-3", leadingClassName)}>
        {leading}
        <span className={cn("min-w-0", textClassName)}>
          <span className={cn("k-item-title-sm block truncate", titleClassName)}>{title}</span>
          {subtitle ? <span className={cn("k-item-caption-truncate", subtitleClassName)}>{subtitle}</span> : null}
        </span>
      </span>
      <span className={cn("flex shrink-0 items-center gap-2", trailingClassName)}>
        {badgeLabel ? <Badge tone={badgeTone} size={badgeSize} className={cn("max-w-[7.25rem]", badgeClassName)}>{badgeLabel}</Badge> : null}
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
