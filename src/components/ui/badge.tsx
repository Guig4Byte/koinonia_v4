import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const badgeTones = ["neutral", "ok", "warn", "risk", "info", "care", "support"] as const;

export type BadgeTone = (typeof badgeTones)[number];
export type BadgeSize = "md" | "sm" | "xs";
export type BadgeShape = "pill" | "rounded";
export type BadgeMaxWidth = "full" | "none" | "header" | "tightHeader" | "list" | "row" | "narrow";

const badgeToneValues = new Set<string>(badgeTones);

export function isBadgeTone(value: unknown): value is BadgeTone {
  return typeof value === "string" && badgeToneValues.has(value);
}

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-secondary)]",
  ok: "border border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[color:var(--color-badge-estavel-text)]",
  warn: "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[color:var(--color-badge-atencao-text)]",
  risk: "border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[color:var(--color-badge-risco-text)]",
  info: "border border-[var(--color-badge-info-border)] bg-[var(--color-badge-info-bg)] text-[color:var(--color-badge-info-text)]",
  care: "border border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] text-[color:var(--color-badge-cuidado-text)]",
  support: "border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] text-[color:var(--color-badge-apoio-text)]",
};

const badgeSizeClass: Record<BadgeSize, string> = {
  md: "px-2.5 py-1 text-[length:var(--text-xs)]",
  sm: "px-2 py-0.5 text-[length:var(--text-xs)]",
  xs: "px-1.5 py-0.5 text-[length:var(--text-xs)]",
};

const badgeShapeClass: Record<BadgeShape, string> = {
  pill: "rounded-full",
  rounded: "rounded-[0.72rem]",
};

const badgeMaxWidthClass: Record<BadgeMaxWidth, string> = {
  full: "max-w-full",
  none: "",
  header: "max-w-[48%]",
  tightHeader: "max-w-[46%]",
  list: "max-w-[7.25rem]",
  row: "max-w-[7.5rem]",
  narrow: "max-w-[6rem]",
};

export function Badge({
  tone = "neutral",
  size = "md",
  shape = "pill",
  maxWidth = "full",
  truncate = true,
  className,
  children,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  shape?: BadgeShape;
  maxWidth?: BadgeMaxWidth;
  truncate?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 shrink-0 items-center justify-center text-center font-semibold leading-tight",
        truncate ? "overflow-hidden whitespace-nowrap" : "whitespace-normal",
        badgeToneClass[tone],
        badgeSizeClass[size],
        badgeShapeClass[shape],
        badgeMaxWidthClass[maxWidth],
        className,
      )}
    >
      <span className={cn("min-w-0", truncate && "truncate")}>{children}</span>
    </span>
  );
}
