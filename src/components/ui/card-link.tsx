import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import {
  priorityCardSurfaceClassName,
  type PriorityCardAccent,
  type PriorityCardContainment,
  type PriorityCardElevation,
  type PriorityCardMinHeight,
  type PriorityCardPadding,
  type PriorityCardLayout,
  type PriorityCardRadius,
  type PriorityCardSurface,
} from "@/components/ui/priority-card";
import type { CardPriorityTone } from "@/lib/card-priority";

type CardLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    priorityTone?: CardPriorityTone;
    padding?: PriorityCardPadding;
    radius?: PriorityCardRadius;
    elevation?: PriorityCardElevation;
    containment?: PriorityCardContainment;
    minHeight?: PriorityCardMinHeight;
    accent?: PriorityCardAccent;
    surface?: PriorityCardSurface;
    layout?: PriorityCardLayout;
    className?: string;
    children: ReactNode;
  };

export function CardLink({
  priorityTone,
  padding = "md",
  radius = "default",
  elevation = "card",
  containment = "visible",
  minHeight = "none",
  accent = "none",
  surface = "default",
  layout = "block",
  className,
  children,
  ...props
}: CardLinkProps) {
  return (
    <Link
      className={priorityCardSurfaceClassName({
        priorityTone,
        padding,
        radius,
        elevation,
        containment,
        minHeight,
        accent,
        surface,
        layout,
        interactive: true,
        className: [layout === "block" ? "block" : "", className].filter(Boolean).join(" "),
      })}
      {...props}
    >
      {children}
    </Link>
  );
}
