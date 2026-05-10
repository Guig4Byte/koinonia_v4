import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "default" | "inset" | "dashed" | "transparent";
export type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
  padding?: CardPadding;
  interactive?: boolean;
  children: ReactNode;
};

const cardToneClass: Record<CardTone, string> = {
  default: "border border-[var(--color-border-card)] bg-[var(--color-bg-card)] shadow-card",
  inset: "border border-[var(--color-border-card)] bg-[var(--surface-alt)]",
  dashed: "border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)]",
  transparent: "border border-transparent bg-transparent",
};

const cardPaddingClass: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Card({
  className,
  tone = "default",
  padding = "md",
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.15rem]",
        cardToneClass[tone],
        cardPaddingClass[padding],
        interactive && "transition active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
