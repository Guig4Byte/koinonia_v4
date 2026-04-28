import { cn } from "@/lib/cn";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        "bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function GhostButton({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition active:scale-[0.98]",
        "border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] text-[var(--color-btn-secondary-text)]",
        className,
      )}
      {...props}
    />
  );
}
