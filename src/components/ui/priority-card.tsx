import type { HTMLAttributes, ReactNode } from "react";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";
import styles from "./priority-card.module.css";

export type PriorityCardPadding = "none" | "xs" | "sm" | "relaxedSm" | "md" | "lg";
export type PriorityCardRadius = "default" | "sm" | "lg";
export type PriorityCardElevation = "card" | "none" | "soft";
export type PriorityCardContainment = "visible" | "hidden";
export type PriorityCardMinHeight = "none" | "sm" | "md";
export type PriorityCardAccent = "none" | "left";
export type PriorityCardSurface = "default" | "brand" | "consultation" | "spotlight" | "spotlightCompact";
export type PriorityCardLayout = "block" | "split";
export type PriorityCardElement = "article" | "section" | "div";

type PriorityCardProps = HTMLAttributes<HTMLElement> & {
  as?: PriorityCardElement;
  priorityTone?: CardPriorityTone;
  padding?: PriorityCardPadding;
  radius?: PriorityCardRadius;
  elevation?: PriorityCardElevation;
  containment?: PriorityCardContainment;
  minHeight?: PriorityCardMinHeight;
  accent?: PriorityCardAccent;
  surface?: PriorityCardSurface;
  layout?: PriorityCardLayout;
  interactive?: boolean;
  children: ReactNode;
};

const priorityCardPaddingClass: Record<PriorityCardPadding, string> = {
  none: "p-0",
  xs: "p-2.5",
  sm: "p-3",
  relaxedSm: "p-3.5",
  md: "p-4",
  lg: "p-5",
};

const priorityCardRadiusClass: Record<PriorityCardRadius, string> = {
  default: "rounded-[1.15rem]",
  sm: "rounded-2xl",
  lg: "rounded-[1.35rem]",
};

const priorityCardElevationClass: Record<PriorityCardElevation, string> = {
  card: "shadow-card",
  none: "shadow-none",
  soft: "shadow-card",
};

const priorityCardContainmentClass: Record<PriorityCardContainment, string> = {
  visible: "",
  hidden: "overflow-hidden",
};

const priorityCardMinHeightClass: Record<PriorityCardMinHeight, string> = {
  none: "",
  sm: "min-h-[4.75rem]",
  md: "min-h-[6rem]",
};

const priorityCardAccentClass: Record<PriorityCardAccent, string> = {
  none: "",
  left: "border-l-4",
};

const priorityCardSurfaceClass: Record<PriorityCardSurface, string> = {
  default: "",
  brand: styles.brand,
  consultation: styles.consultation,
  spotlight: styles.spotlight,
  spotlightCompact: styles.spotlightCompact,
};

const priorityCardLayoutClass: Record<PriorityCardLayout, string> = {
  block: "",
  split: styles.split,
};

export function priorityCardSurfaceClassName({
  priorityTone,
  padding = "md",
  radius = "default",
  elevation = "card",
  containment = "visible",
  minHeight = "none",
  accent = "none",
  surface = "default",
  layout = "block",
  interactive = false,
  className,
}: {
  priorityTone?: CardPriorityTone;
  padding?: PriorityCardPadding;
  radius?: PriorityCardRadius;
  elevation?: PriorityCardElevation;
  containment?: PriorityCardContainment;
  minHeight?: PriorityCardMinHeight;
  accent?: PriorityCardAccent;
  surface?: PriorityCardSurface;
  layout?: PriorityCardLayout;
  interactive?: boolean;
  className?: string;
} = {}) {
  return cn(
    interactive && "card-hover-lift transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]",
    priorityCardRadiusClass[radius],
    "border border-[var(--color-border-card)] bg-[var(--color-bg-card)]",
    priorityCardElevationClass[elevation],
    priorityCardPaddingClass[padding],
    priorityCardContainmentClass[containment],
    priorityCardMinHeightClass[minHeight],
    priorityCardAccentClass[accent],
    priorityCardSurfaceClass[surface],
    priorityCardLayoutClass[layout],
    priorityCardClass(priorityTone),
    className,
  );
}

export function PriorityCard({
  as: Component = "article",
  priorityTone,
  padding = "md",
  radius = "default",
  elevation = "card",
  containment = "visible",
  minHeight = "none",
  accent = "none",
  surface = "default",
  layout = "block",
  interactive = false,
  className,
  children,
  ...props
}: PriorityCardProps) {
  return (
    <Component
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
        interactive,
        className,
      })}
      {...props}
    >
      {children}
    </Component>
  );
}
