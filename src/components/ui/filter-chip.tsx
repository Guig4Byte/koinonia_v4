import Link, { type LinkProps } from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./filter-chip.module.css";

export type FilterChipVariant = "team" | "period";
export type FilterChipLayout = "default" | "withDot";
export type FilterChipMaxWidth = "default" | "none";

type FilterChipProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "className"> & {
    active?: boolean;
    variant?: FilterChipVariant;
    layout?: FilterChipLayout;
    maxWidth?: FilterChipMaxWidth;
    className?: string;
    children: ReactNode;
  };

const periodBaseClass = "inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-3 py-0 text-center text-[length:var(--text-xs)] font-semibold leading-tight whitespace-nowrap transition active:scale-[0.98]";
const periodActiveClass = "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[color:var(--color-brand)]";
const periodInactiveClass = "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[color:var(--color-text-secondary)]";

export function filterChipClassName({
  active = false,
  variant = "team",
  layout = "default",
  maxWidth = "default",
  className,
}: {
  active?: boolean;
  variant?: FilterChipVariant;
  layout?: FilterChipLayout;
  maxWidth?: FilterChipMaxWidth;
  className?: string;
} = {}) {
  if (variant === "period") {
    return cn(periodBaseClass, active ? periodActiveClass : periodInactiveClass, className);
  }

  return cn(
    styles.team,
    active && styles.teamActive,
    layout === "withDot" && styles.withDot,
    maxWidth === "none" && styles.maxWidthNone,
    className,
  );
}

export const FilterChip = forwardRef<HTMLAnchorElement, FilterChipProps>(function FilterChip(
  { active = false, variant = "team", layout = "default", maxWidth = "default", className, children, ...props },
  ref,
) {
  return (
    <Link ref={ref} className={filterChipClassName({ active, variant, layout, maxWidth, className })} {...props}>
      {children}
    </Link>
  );
});
