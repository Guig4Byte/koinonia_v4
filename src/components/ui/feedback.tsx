import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/cn";

export type FeedbackTone = "info" | "success" | "warning" | "error" | "care" | "support";

type FeedbackProps = {
  tone?: FeedbackTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  role?: "alert" | "status";
  ariaLive?: "polite" | "assertive" | "off";
};

const feedbackToneClass: Record<FeedbackTone, string> = {
  info: "border-[var(--color-badge-info-border)] bg-[var(--color-badge-info-bg)] text-[color:var(--color-badge-info-text)]",
  success: "border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[color:var(--color-badge-estavel-text)]",
  warning: "border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[color:var(--color-badge-atencao-text)]",
  error: "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[color:var(--color-badge-risco-text)]",
  care: "border-[var(--color-badge-cuidado-border)] bg-[var(--color-badge-cuidado-bg)] text-[color:var(--color-badge-cuidado-text)]",
  support: "border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] text-[color:var(--color-badge-apoio-text)]",
};

const feedbackIcon = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: AlertCircle,
  care: CheckCircle2,
  support: LifeBuoy,
};

export function Feedback({
  tone = "info",
  title,
  children,
  className,
  compact = false,
  role,
  ariaLive,
}: FeedbackProps) {
  const Icon = feedbackIcon[tone];

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={cn(
        "rounded-2xl border text-[length:var(--text-sm)] leading-relaxed",
        compact ? "px-3 py-2 text-[length:var(--text-xs)]" : "p-3",
        feedbackToneClass[tone],
        className,
      )}
    >
      {title ? (
        <div className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4" strokeWidth={2.2} />
          {title}
        </div>
      ) : null}
      <div className={cn(title && "mt-1 text-[color:var(--color-text-secondary)]")}>{children}</div>
    </div>
  );
}
