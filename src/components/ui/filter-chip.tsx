import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type FilterChipVariant = "team" | "period";

type FilterChipProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    active?: boolean;
    variant?: FilterChipVariant;
    className?: string;
    children: ReactNode;
  };

const periodBaseClass = "rounded-full border px-3 py-2 text-[length:var(--text-xs)] font-semibold transition active:scale-[0.98]";
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

  return cn("team-filter-chip", active && "team-filter-chip-active", className);
}

export function FilterChip({ active = false, variant = "team", className, children, ...props }: FilterChipProps) {
  return (
    <Link className={filterChipClassName({ active, variant, className })} {...props}>
      {children}
    </Link>
  );
}
