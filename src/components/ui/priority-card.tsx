import type { HTMLAttributes, ReactNode } from "react";
import { priorityCardClass, type CardPriorityTone } from "@/lib/card-priority";
import { cn } from "@/lib/cn";

export type PriorityCardPadding = "sm" | "md" | "lg";
export type PriorityCardElement = "article" | "section" | "div";

type PriorityCardProps = HTMLAttributes<HTMLElement> & {
  as?: PriorityCardElement;
  priorityTone?: CardPriorityTone;
  padding?: PriorityCardPadding;
  interactive?: boolean;
  children: ReactNode;
};

const priorityCardPaddingClass: Record<PriorityCardPadding, string> = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function priorityCardSurfaceClassName({
  priorityTone,
  padding = "md",
  interactive = false,
  className,
}: {
  priorityTone?: CardPriorityTone;
  padding?: PriorityCardPadding;
  interactive?: boolean;
  className?: string;
} = {}) {
  return cn(
    interactive && "card-hover-lift transition active:scale-[0.99]",
    "rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card",
    priorityCardPaddingClass[padding],
    priorityCardClass(priorityTone),
    className,
  );
}

export function PriorityCard({
  as: Component = "article",
  priorityTone,
  padding = "md",
  interactive = false,
  className,
  children,
  ...props
}: PriorityCardProps) {
  return (
    <Component
      className={priorityCardSurfaceClassName({ priorityTone, padding, interactive, className })}
      {...props}
    >
      {children}
    </Component>
  );
}
