import { Heart } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  children,
  className,
  compact = false,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  compact?: boolean;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-dashed border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]",
        compact ? "px-3 py-2.5" : "min-h-16 p-4",
        className,
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-full border border-[var(--color-border-card)] bg-[var(--color-bg-card)] text-[color:var(--color-text-secondary)]",
          compact ? "mt-0.5 h-7 w-7" : "h-9 w-9",
        )}
        aria-hidden="true"
      >
        <Heart className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </span>
      <div className="min-w-0 pt-0.5">
        {title ? <p className="font-semibold text-[color:var(--color-text-primary)]">{title}</p> : null}
        <p className={cn(title ? "mt-1" : undefined)}>{children}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
