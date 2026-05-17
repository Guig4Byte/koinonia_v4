"use client";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { checkInMarkedLabel, type CheckInMode, type CheckInSummary } from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import styles from "./check-in.module.css";

type CheckInSaveBarProps = {
  summary: CheckInSummary;
  mode: CheckInMode;
  cancelHref?: string;
  cancelLabel: string;
  canSave: boolean;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  errorMessage: string | null;
  submitLabel: string;
  onSave: () => void;
};

function saveBarTitle({
  summary,
  mode,
  hasUnsavedChanges,
  isPending,
  errorMessage,
}: {
  summary: CheckInSummary;
  mode: CheckInMode;
  hasUnsavedChanges: boolean;
  isPending: boolean;
  errorMessage: string | null;
}) {
  if (isPending) return "Salvando presença";
  if (errorMessage) return "Não foi salvo";
  if (summary.pending > 0) return summary.pending === 1 ? "Falta 1 marcação" : `Faltam ${summary.pending} marcações`;
  if (mode === "adjust" && !hasUnsavedChanges) return "Sem alterações";
  if (mode === "adjust") return "Pronto para atualizar";

  return "Pronto para salvar";
}

function saveBarDescription({
  summary,
  isPending,
  errorMessage,
  mode,
  hasUnsavedChanges,
}: {
  summary: CheckInSummary;
  isPending: boolean;
  errorMessage: string | null;
  mode: CheckInMode;
  hasUnsavedChanges: boolean;
}) {
  if (isPending) return "Mantenha esta tela aberta até concluir.";
  if (errorMessage) return "Revise o aviso e tente salvar novamente.";
  if (summary.pending > 0) return `${checkInMarkedLabel(summary)}. Complete as pendências para salvar.`;
  if (mode === "adjust" && !hasUnsavedChanges) return "Altere uma presença ou adicione visitante para salvar.";
  if (mode === "adjust") return "Tudo marcado. Salve as mudanças.";

  return "Tudo marcado. Salve para concluir.";
}

export function CheckInSaveBar({
  summary,
  mode,
  cancelHref,
  cancelLabel,
  canSave,
  hasUnsavedChanges,
  isPending,
  errorMessage,
  submitLabel,
  onSave,
}: CheckInSaveBarProps) {
  const title = saveBarTitle({ summary, mode, hasUnsavedChanges, isPending, errorMessage });
  const description = saveBarDescription({ summary, isPending, errorMessage, mode, hasUnsavedChanges });

  return (
    <div
      data-testid="check-in-save-bar"
      role="status"
      aria-live="polite"
      className={cn(
        styles.saveBar,
        "rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-2.5 shadow-card backdrop-blur-xl",
        !canSave && !isPending && !errorMessage && styles.saveBarIdle,
      )}
    >
      <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto] min-[390px]:items-center">
        <div className="min-w-0">
          <p className="k-item-title-sm truncate">{title}</p>
          <p className="mt-0.5 truncate text-[length:var(--text-xs)] text-[color:var(--color-text-secondary)]">
            {description}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 min-[390px]:flex min-[390px]:shrink-0 min-[390px]:items-center">
          {cancelHref ? (
            <ButtonLink
              href={cancelHref}
              aria-disabled={isPending}
              variant="secondary"
              size="sm"
              shape="pill"
              responsiveWidth="fullUntilSm"
              className={cn(isPending && "pointer-events-none saturate-75")}
            >
              {cancelLabel}
            </ButtonLink>
          ) : null}
          <Button disabled={!canSave} loading={isPending} onClick={onSave} size="sm" responsiveWidth="fullUntilSm" className="min-w-24">
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
