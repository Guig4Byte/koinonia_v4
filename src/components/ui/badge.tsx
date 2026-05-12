import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const badgeTones = ["neutral", "ok", "warn", "risk", "info", "care", "support"] as const;

export type BadgeTone = (typeof badgeTones)[number];
export type BadgeSize = "md" | "sm";

const badgeToneValues = new Set<string>(badgeTones);

export function isBadgeTone(value: unknown): value is BadgeTone {
  return typeof value === "string" && badgeToneValues.has(value);
}

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-secondary)]",
  ok: "border border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[color:var(--color-badge-estavel-text)]",
  warn: "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[color:var(--color-badge-atencao-text)]",
  risk: "border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[color:var(--color-badge-risco-text)]",
  info: "border border-[var(--color-border-card)] bg-[var(--info-soft)] text-[color:var(--color-brand)]",
  care: "border border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] text-[color:var(--color-badge-cuidado-text)]",
  support: "border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] text-[color:var(--color-badge-apoio-text)]",
};

const badgeSizeClass: Record<BadgeSize, string> = {
  md: "px-2.5 py-1 text-[length:var(--text-xs)]",
  sm: "px-2 py-0.5 text-[length:var(--text-xs)]",
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  children,
}: {
  tone?: BadgeTone;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center justify-center overflow-hidden rounded-full text-center font-semibold leading-tight whitespace-nowrap",
        badgeToneClass[tone],
        badgeSizeClass[size],
        className,
      )}
    >
      <span className="min-w-0 truncate">{children}</span>
    </span>
  );
}
