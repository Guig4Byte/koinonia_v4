import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "ok" | "warn" | "risk" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "border border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[var(--color-text-secondary)]",
  ok: "border border-[var(--color-badge-estavel-border)] bg-[var(--color-badge-estavel-bg)] text-[var(--color-badge-estavel-text)]",
  warn: "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[var(--color-badge-atencao-text)]",
  risk: "border border-[var(--color-badge-atencao-border)] bg-[var(--color-badge-atencao-bg)] text-[var(--color-badge-atencao-text)]",
  info: "border border-[var(--color-border-card)] bg-[var(--info-soft)] text-[var(--color-brand)]",
};

export function Badge({ tone = "neutral", className, children }: { tone?: BadgeTone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
