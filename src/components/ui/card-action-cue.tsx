import { ArrowRight } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./card-action-cue.module.css";

export type CardActionCueVariant = "pill" | "icon";
export type CardActionCueTone = "brand" | "decorative" | "neutral";
export type CardActionCueSize = "sm" | "md";

type CardActionCueProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  children?: ReactNode;
  variant?: CardActionCueVariant;
  tone?: CardActionCueTone;
  size?: CardActionCueSize;
  icon?: ReactNode;
  iconPosition?: "before" | "after";
  enhanceOnGroupHover?: boolean;
  shiftOnGroupActive?: boolean;
  mobileCompact?: boolean;
};

const toneClass: Record<CardActionCueTone, string> = {
  brand: styles.toneBrand,
  decorative: styles.toneDecorative,
  neutral: styles.toneNeutral,
};

function defaultIcon() {
  return <ArrowRight className={styles.iconSvg} strokeWidth={2.35} aria-hidden="true" />;
}

export function CardActionCue({
  children,
  variant = "pill",
  tone = "brand",
  size = "sm",
  icon,
  iconPosition = "after",
  enhanceOnGroupHover = false,
  shiftOnGroupActive = true,
  mobileCompact = false,
  className,
  ...props
}: CardActionCueProps) {
  const actionIcon = icon ?? defaultIcon();
  const shouldRenderIcon = variant === "icon" || Boolean(icon) || iconPosition === "after";

  return (
    <span
      className={cn(
        styles.cue,
        styles[variant],
        styles[size],
        toneClass[tone],
        enhanceOnGroupHover && styles.hoverable,
        shiftOnGroupActive && styles.shiftOnGroupActive,
        mobileCompact && styles.mobileCompact,
        className,
      )}
      {...props}
    >
      {variant === "icon" ? actionIcon : null}
      {variant === "pill" && iconPosition === "before" ? actionIcon : null}
      {variant === "pill" ? children : null}
      {variant === "pill" && iconPosition === "after" && shouldRenderIcon ? actionIcon : null}
    </span>
  );
}
