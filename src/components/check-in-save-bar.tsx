"use client";

import Link from "next/link";
import { Button, buttonClassName } from "@/components/ui/button";
import type { CheckInMode, CheckInSummary } from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";

type CheckInSaveBarProps = {
  summary: CheckInSummary;
  mode: CheckInMode;
  cancelHref?: string;
  cancelLabel: string;
  canSave: boolean;
  isPending: boolean;
  submitLabel: string;
  saveBarOffset: "nav" | "page";
  onSave: () => void;
};

export function CheckInSaveBar({
  summary,
  mode,
  cancelHref,
  cancelLabel,
  canSave,
  isPending,
  submitLabel,
  saveBarOffset,
  onSave,
}: CheckInSaveBarProps) {
  return (
    <div
      className={cn(
        "check-in-save-bar rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-tab)] p-3 shadow-card backdrop-blur-xl",
        saveBarOffset === "page" ? "check-in-save-bar-page" : "check-in-save-bar-nav",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {summary.pending > 0 ? `Faltam ${summary.pending}` : "Pronto para salvar"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
            {summary.pending > 0
              ? "Marque todos para salvar."
              : mode === "adjust"
                ? "Revise e salve as mudanças."
                : "Depois, acompanhe quem precisar."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {cancelHref ? (
            <Link
              href={cancelHref}
              className={buttonClassName({ variant: "secondary", size: "md", className: "rounded-full px-3" })}
            >
              {cancelLabel}
            </Link>
          ) : null}
          <Button disabled={!canSave} onClick={onSave} className="min-w-28">
            {isPending ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
