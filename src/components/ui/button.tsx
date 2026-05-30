import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "primaryFlat"
  | "secondary"
  | "quiet"
  | "ghost"
  | "stableSoft"
  | "attentionSoft"
  | "dangerSoft"
  | "infoSoft"
  | "supportSoft"
  | "warmSoft"
  | "tab"
  | "tabActive"
  | "outline";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonShape = "default" | "soft" | "rounded" | "pill";
export type ButtonDensity = "default" | "compact" | "badge" | "status" | "inlineAction" | "inlineCompact" | "tab";
export type ButtonAlign = "center" | "left" | "between";
export type ButtonResponsiveWidth = "auto" | "full" | "fullUntilSm";

type ButtonClassNameOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  density?: ButtonDensity;
  align?: ButtonAlign;
  fullWidth?: boolean;
  responsiveWidth?: ButtonResponsiveWidth;
  className?: string;
};

const buttonBaseClass =
  "inline-flex items-center justify-center gap-2 text-center font-semibold leading-tight tracking-normal transition active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:saturate-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus-ring)]";

const buttonVariantClass: Record<ButtonVariant, string> = {
  primary:
    "border border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)] text-[color:var(--color-btn-primary-text)] shadow-card hover:opacity-95",
  primaryFlat:
    "border border-[var(--color-btn-primary-bg)] bg-[var(--color-btn-primary-bg)] text-[color:var(--color-btn-primary-text)] hover:opacity-95",
  secondary:
    "border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[color:var(--color-btn-secondary-text)] hover:bg-[var(--surface-alt)]",
  quiet:
    "border border-[var(--color-border-divider)] bg-transparent text-[color:var(--color-text-secondary)] hover:border-[var(--color-border-card)] hover:bg-[var(--surface-alt)]",
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
  warmSoft:
    "border border-[color-mix(in_srgb,var(--brown-400)_58%,var(--color-border-card))] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brown-300)_24%,var(--color-bg-card)),color-mix(in_srgb,var(--brown-400)_12%,var(--color-bg-card)))] text-[color:color-mix(in_srgb,var(--status-warning-text)_78%,var(--color-brand-accent))] shadow-[inset_0_1px_0_color-mix(in_srgb,var(--surface-alt)_54%,transparent),0_10px_22px_color-mix(in_srgb,var(--brown-400)_12%,transparent)] hover:border-[color-mix(in_srgb,var(--brown-300)_82%,var(--color-focus-ring))] hover:bg-[linear-gradient(180deg,color-mix(in_srgb,var(--brown-300)_30%,var(--color-bg-card)),color-mix(in_srgb,var(--brown-400)_16%,var(--color-bg-card)))] hover:text-[color:var(--status-warning-text)]",
  tab:
    "min-w-0 border border-transparent bg-transparent text-[color:var(--color-text-secondary)] shadow-none hover:border-[var(--color-border-card)] hover:bg-[var(--surface-alt)]",
  tabActive:
    "min-w-0 border border-[color-mix(in_srgb,var(--color-brand-accent)_38%,var(--color-border-card))] bg-[radial-gradient(ellipse_82%_68%_at_18%_0%,color-mix(in_srgb,var(--color-brand-accent)_16%,transparent),transparent_70%),color-mix(in_srgb,var(--color-brand-accent)_10%,var(--color-bg-card))] text-[color:color-mix(in_srgb,var(--color-brand-accent)_88%,var(--color-text-primary))] shadow-[inset_0_-2px_0_color-mix(in_srgb,var(--color-brand-accent)_68%,transparent)]",
  outline: "border border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[color:var(--color-text-primary)] hover:bg-[var(--surface-alt)]",
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: "min-h-11 rounded-xl px-3 py-2 text-[length:var(--text-sm)]",
  md: "min-h-11 rounded-2xl px-4 py-3 text-[length:var(--text-sm)]",
  lg: "min-h-12 rounded-2xl px-5 py-3 text-[length:var(--text-base)]",
};

const buttonShapeClass: Record<ButtonShape, string> = {
  default: "",
  soft: "rounded-xl",
  rounded: "rounded-2xl",
  pill: "rounded-full",
};

const buttonDensityClass: Record<ButtonDensity, string> = {
  default: "",
  compact: "min-h-10 px-3 py-1.5 text-[length:var(--text-xs)]",
  badge: "min-h-11 px-3 py-2 text-[length:var(--text-xs)]",
  status: "min-h-[2.15rem] px-[0.78rem] py-[0.34rem] text-[length:var(--text-xs)]",
  inlineAction: "min-h-[2.34rem] px-[1.14rem] py-[0.38rem] text-[length:var(--text-sm)] font-bold",
  inlineCompact: "min-h-[2.35rem] px-[0.88rem] py-[0.38rem] text-[length:var(--text-xs)] font-extrabold",
  tab: "min-h-[3.08rem] gap-[0.48rem] px-[0.58rem] py-2 text-[length:var(--text-sm)]",
};

const buttonAlignClass: Record<ButtonAlign, string> = {
  center: "justify-center text-center",
  left: "justify-start text-left",
  between: "justify-between text-left",
};

const buttonResponsiveWidthClass: Record<ButtonResponsiveWidth, string> = {
  auto: "",
  full: "w-full",
  fullUntilSm: "w-full min-[390px]:w-auto",
};

export function buttonClassName({
  variant = "primary",
  size = "md",
  shape = "default",
  density = "default",
  align = "center",
  fullWidth = false,
  responsiveWidth = "auto",
  className,
}: ButtonClassNameOptions = {}) {
  const widthClass = responsiveWidth === "auto" ? fullWidth && "w-full" : buttonResponsiveWidthClass[responsiveWidth];

  return cn(
    buttonBaseClass,
    buttonVariantClass[variant],
    buttonSizeClass[size],
    buttonShapeClass[shape],
    buttonDensityClass[density],
    buttonAlignClass[align],
    widthClass,
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  density?: ButtonDensity;
  align?: ButtonAlign;
  fullWidth?: boolean;
  responsiveWidth?: ButtonResponsiveWidth;
  loading?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  shape = "default",
  density = "default",
  align = "center",
  fullWidth = false,
  responsiveWidth = "auto",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, size, shape, density, align, fullWidth, responsiveWidth, className })}
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
