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
  errorMessage: string | null;
  submitLabel: string;
  saveBarOffset: "nav" | "page";
  onSave: () => void;
};

function saveBarTitle({ pending, isPending, errorMessage }: { pending: number; isPending: boolean; errorMessage: string | null }) {
  if (isPending) return "Salvando presença";
  if (errorMessage) return "Não foi salvo";
  if (pending > 0) return `Faltam ${pending}`;
  return "Pronto para salvar";
}

function saveBarDescription({
  pending,
  isPending,
  errorMessage,
  mode,
}: {
  pending: number;
  isPending: boolean;
  errorMessage: string | null;
  mode: CheckInMode;
}) {
  if (isPending) return "Mantenha esta tela aberta até concluir.";
  if (errorMessage) return "Revise o aviso e tente salvar novamente.";
  if (pending > 0) return "Marque todos para salvar.";
  if (mode === "adjust") return "Revise e salve as mudanças.";
  return "Depois, acompanhe quem precisar.";
}

export function CheckInSaveBar({
  summary,
  mode,
  cancelHref,
  cancelLabel,
  canSave,
  isPending,
  errorMessage,
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
          <p className="k-item-title-sm">
            {saveBarTitle({ pending: summary.pending, isPending, errorMessage })}
          </p>
          <p className="mt-0.5 text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
            {saveBarDescription({ pending: summary.pending, isPending, errorMessage, mode })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {cancelHref ? (
            <Link
              href={cancelHref}
              aria-disabled={isPending}
              className={buttonClassName({
                variant: "secondary",
                size: "md",
                className: cn("rounded-full px-3", isPending && "pointer-events-none opacity-50"),
              })}
            >
              {cancelLabel}
            </Link>
          ) : null}
          <Button disabled={!canSave} loading={isPending} onClick={onSave} className="min-w-28">
            {isPending ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p role="alert" aria-live="assertive" className="mt-2 text-[length:var(--text-xs)] font-medium text-[color:var(--color-badge-risco-text)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
