import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./status-card.module.css";

export type StatusCardTone = "neutral" | "success" | "danger" | "warning" | "info" | "care";
export type StatusCardPadding = "sm" | "md";
export type StatusCardRadius = "sm" | "default";
export type StatusCardContainment = "visible" | "hidden";
export type StatusCardElement = "article" | "section" | "div";

type StatusCardProps<TElement extends StatusCardElement = "div"> = HTMLAttributes<HTMLElement> & {
  as?: TElement;
  tone?: StatusCardTone;
  padding?: StatusCardPadding;
  radius?: StatusCardRadius;
  containment?: StatusCardContainment;
  children: ReactNode;
};

const toneClass: Record<StatusCardTone, string> = {
  neutral: styles.toneNeutral,
  success: styles.toneSuccess,
  danger: styles.toneDanger,
  warning: styles.toneWarning,
  info: styles.toneInfo,
  care: styles.toneCare,
};

const paddingClass: Record<StatusCardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
};

const radiusClass: Record<StatusCardRadius, string> = {
  sm: styles.radiusSm,
  default: styles.radiusDefault,
};

const containmentClass: Record<StatusCardContainment, string> = {
  visible: "",
  hidden: styles.containmentHidden,
};

export function StatusCard<TElement extends StatusCardElement = "div">({
  as,
  tone = "neutral",
  padding = "md",
  radius = "default",
  containment = "visible",
  className,
  children,
  ...props
}: StatusCardProps<TElement>) {
  const Component = (as ?? "div") as ElementType;

  return (
    <Component
      className={cn(styles.root, toneClass[tone], paddingClass[padding], radiusClass[radius], containmentClass[containment], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
