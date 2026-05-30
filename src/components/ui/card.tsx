import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./card.module.css";

export type CardTone = "default" | "featured" | "inset" | "dashed" | "transparent";
export type CardPadding = "none" | "sm" | "md" | "lg";
export type CardRadius = "default" | "sm" | "lg";
export type CardElevation = "auto" | "none" | "card" | "soft";
export type CardContainment = "visible" | "hidden";
export type CardMinHeight = "none" | "sm" | "md";
export type CardStatusTone = "none" | "care" | "warning" | "success" | "danger" | "info";
export type CardSurface = "default" | "warmGlow" | "accentGlow" | "notice" | "summaryGlow" | "pastoralCue" | "heroGlow";
export type CardAccentTone = "default" | "success" | "warning" | "danger" | "info" | "muted" | "presence" | "support" | "care";
export type CardLayout = "block" | "media" | "split";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
  padding?: CardPadding;
  radius?: CardRadius;
  elevation?: CardElevation;
  containment?: CardContainment;
  minHeight?: CardMinHeight;
  statusTone?: CardStatusTone;
  surface?: CardSurface;
  accentTone?: CardAccentTone;
  layout?: CardLayout;
  interactive?: boolean;
  children: ReactNode;
};

const cardToneClass: Record<CardTone, string> = {
  default: "border border-[var(--color-border-card)] bg-[var(--color-bg-card)]",
  featured: "k-feature-card border border-[var(--color-border-card)] bg-[var(--color-bg-card)]",
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

const cardRadiusClass: Record<CardRadius, string> = {
  default: "rounded-[1.15rem]",
  sm: "rounded-2xl",
  lg: "rounded-[1.35rem]",
};

const cardElevationClass: Record<Exclude<CardElevation, "auto">, string> = {
  none: "shadow-none",
  card: "shadow-card",
  soft: "shadow-card",
};

const cardContainmentClass: Record<CardContainment, string> = {
  visible: "",
  hidden: "overflow-hidden",
};

const cardMinHeightClass: Record<CardMinHeight, string> = {
  none: "",
  sm: "min-h-[4.75rem]",
  md: "min-h-[6rem]",
};

const cardStatusToneClass: Record<CardStatusTone, string> = {
  none: "",
  care: "border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)]",
  warning: "border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)]",
  success: "border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)]",
  danger: "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)]",
  info: "border-[var(--color-badge-info-border)] bg-[var(--color-badge-info-bg)]",
};

const cardSurfaceClass: Record<CardSurface, string> = {
  default: "",
  warmGlow: styles.warmGlow,
  accentGlow: styles.accentGlow,
  notice: styles.notice,
  summaryGlow: styles.summaryGlow,
  pastoralCue: styles.pastoralCue,
  heroGlow: styles.heroGlow,
};

const cardAccentToneClass: Record<CardAccentTone, string> = {
  default: "",
  success: styles.accentSuccess,
  warning: styles.accentWarning,
  danger: styles.accentDanger,
  info: styles.accentInfo,
  muted: styles.accentMuted,
  presence: styles.accentPresence,
  support: styles.accentSupport,
  care: styles.accentCare,
};

const cardLayoutClass: Record<CardLayout, string> = {
  block: "",
  media: styles.mediaLayout,
  split: styles.splitLayout,
};

function resolveCardElevation(tone: CardTone, elevation: CardElevation) {
  if (elevation !== "auto") {
    return cardElevationClass[elevation];
  }

  return tone === "default" || tone === "featured" ? cardElevationClass.card : "";
}

export function Card({
  className,
  tone = "default",
  padding = "md",
  radius = "default",
  elevation = "auto",
  containment = "visible",
  minHeight = "none",
  statusTone = "none",
  surface = "default",
  accentTone = "default",
  layout = "block",
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        cardRadiusClass[radius],
        cardToneClass[tone],
        resolveCardElevation(tone, elevation),
        cardPaddingClass[padding],
        cardContainmentClass[containment],
        cardMinHeightClass[minHeight],
        cardStatusToneClass[statusTone],
        cardSurfaceClass[surface],
        cardAccentToneClass[accentTone],
        cardLayoutClass[layout],
        interactive && "card-hover-lift transition active:scale-[0.99]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
