import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "primaryFlat"
  | "secondary"
  | "ghost"
  | "stableSoft"
  | "attentionSoft"
  | "dangerSoft"
  | "infoSoft"
  | "supportSoft"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 text-center font-semibold leading-tight tracking-normal transition active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:saturate-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)] text-[color:var(--color-btn-primary-text)] shadow-card hover:opacity-95",
  primaryFlat:
    "border border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)] text-[color:var(--color-btn-primary-text)] hover:opacity-95",
  secondary:
    "border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[color:var(--color-btn-secondary-text)] hover:bg-[var(--surface-alt)]",
  ghost: "text-[color:var(--color-text-secondary)] hover:bg-[var(--surface-alt)]",
  stableSoft:
    "border border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[color:var(--color-badge-estavel-text)]",
  attentionSoft:
    "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[color:var(--color-badge-atencao-text)]",
  dangerSoft:
    "border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[color:var(--color-badge-risco-text)]",
  infoSoft:
    "border border-[var(--color-badge-info-border)] bg-[var(--color-badge-info-bg)] text-[color:var(--color-badge-info-text)]",
  supportSoft:
    "border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] text-[color:var(--color-badge-apoio-text)]",
  outline: "border border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[color:var(--color-text-primary)] hover:bg-[var(--surface-alt)]",
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: "min-h-11 rounded-xl px-3 py-2 text-[length:var(--text-sm)]",
  md: "min-h-11 rounded-2xl px-4 py-3 text-[length:var(--text-sm)]",
  lg: "min-h-12 rounded-2xl px-5 py-3 text-[length:var(--text-base)]",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonClassNameOptions = {}) {
  return cn(buttonBaseClass, buttonVariantClass[variant], buttonSizeClass[size], fullWidth && "w-full", className);
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}
