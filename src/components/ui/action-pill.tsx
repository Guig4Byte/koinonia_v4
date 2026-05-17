import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./action-pill.module.css";

export type ActionPillTone = "secondary" | "primary" | "prioritySoft";
export type ActionPillSize = "md" | "sm" | "xs";
export type ActionPillMinWidth = "none" | "action";

type ActionPillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ActionPillTone;
  size?: ActionPillSize;
  minWidth?: ActionPillMinWidth;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
  shiftIcon?: boolean;
  pressOnGroupActive?: boolean;
  children: ReactNode;
};

export function ActionPill({
  tone = "secondary",
  size = "md",
  minWidth = "none",
  iconBefore,
  iconAfter,
  shiftIcon = false,
  pressOnGroupActive = false,
  className,
  children,
  ...props
}: ActionPillProps) {
  const iconClassName = cn(styles.icon, shiftIcon && styles.shiftRight);

  return (
    <span
      className={cn(
        styles.pill,
        styles[tone],
        styles[size],
        minWidth === "action" && styles.actionWidth,
        pressOnGroupActive && styles.pressDown,
        className,
      )}
      {...props}
    >
      {iconBefore ? <span className={iconClassName} aria-hidden="true">{iconBefore}</span> : null}
      {children}
      {iconAfter ? <span className={iconClassName} aria-hidden="true">{iconAfter}</span> : null}
    </span>
  );
}
