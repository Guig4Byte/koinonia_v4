import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./filter-chip.module.css";

export type FilterChipVariant = "team" | "period";

type FilterChipProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    active?: boolean;
    variant?: FilterChipVariant;
    className?: string;
    children: ReactNode;
  };

const periodBaseClass = "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-3 py-0 text-center text-[length:var(--text-xs)] font-semibold leading-tight whitespace-nowrap transition active:scale-[0.98]";
const periodActiveClass = "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[color:var(--color-brand)]";
const periodInactiveClass = "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-secondary)]";

export function filterChipClassName({
  active = false,
  variant = "team",
  className,
}: {
  active?: boolean;
  variant?: FilterChipVariant;
  className?: string;
} = {}) {
  if (variant === "period") {
    return cn(periodBaseClass, active ? periodActiveClass : periodInactiveClass, className);
  }

  return cn(styles.team, active && styles.teamActive, className);
}

export function FilterChip({ active = false, variant = "team", className, children, ...props }: FilterChipProps) {
  return (
    <Link className={filterChipClassName({ active, variant, className })} {...props}>
      {children}
    </Link>
  );
}
