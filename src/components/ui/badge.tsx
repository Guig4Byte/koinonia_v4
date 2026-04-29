import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const badgeTones = ["neutral", "ok", "warn", "risk", "info", "care", "support"] as const;

export type BadgeTone = (typeof badgeTones)[number];

const badgeToneValues = new Set<string>(badgeTones);

export function isBadgeTone(value: unknown): value is BadgeTone {
  return typeof value === "string" && badgeToneValues.has(value);
}

const badgeToneClass: Record<BadgeTone, string> = {
  neutral: "border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[var(--color-text-secondary)]",
  ok: "border border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[var(--color-badge-estavel-text)]",
  warn: "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[var(--color-badge-atencao-text)]",
  risk: "border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[var(--color-badge-risco-text)]",
  info: "border border-[var(--color-border-card)] bg-[var(--info-soft)] text-[var(--color-brand)]",
  care: "border border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] text-[var(--color-badge-cuidado-text)]",
  support: "border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] text-[var(--color-badge-apoio-text)]",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full shrink-0 items-center justify-center rounded-full px-2.5 py-1 text-center text-xs font-semibold leading-tight whitespace-nowrap",
        badgeToneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
