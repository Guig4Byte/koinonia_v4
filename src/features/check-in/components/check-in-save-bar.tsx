"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import type { CheckInMode, CheckInSummary } from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import styles from "./check-in.module.css";

type CheckInSaveBarProps = {
  summary: CheckInSummary;
  mode: CheckInMode;
  cancelHref?: string;
  cancelLabel: string;
  canSave: boolean;
  isPending: boolean;
  errorMessage: string | null;
  submitLabel: string;
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
  onSave,
}: CheckInSaveBarProps) {
  return (
    <div
      data-testid="check-in-save-bar"
      className={cn(
        styles.saveBar,
        "rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-2.5 shadow-card backdrop-blur-xl",
      )}
    >
      <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto] min-[390px]:items-center">
        <div className="min-w-0">
          <p className="k-item-title-sm truncate">
            {saveBarTitle({ pending: summary.pending, isPending, errorMessage })}
          </p>
          <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
            {saveBarDescription({ pending: summary.pending, isPending, errorMessage, mode })}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 min-[390px]:flex min-[390px]:shrink-0 min-[390px]:items-center">
          {cancelHref ? (
            <ButtonLink
              href={cancelHref}
              aria-disabled={isPending}
              variant="secondary"
              size="sm"
              className={cn("w-full rounded-full px-3 min-[390px]:w-auto", isPending && "pointer-events-none saturate-75")}
            >
              {cancelLabel}
            </ButtonLink>
          ) : null}
          <Button disabled={!canSave} loading={isPending} onClick={onSave} size="sm" className="w-full min-w-24 min-[390px]:w-auto">
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
