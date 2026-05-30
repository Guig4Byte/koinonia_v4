"use client";

import { Button } from "@/components/ui/button";
import { FixedActionBar } from "@/components/ui/fixed-action-bar";
import { ButtonLink } from "@/components/ui/button-link";
import { checkInMarkedLabel, type CheckInMode, type CheckInSummary } from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";

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
  onCancelAttempt?: () => boolean;
  onSave: () => void;
};

export function shouldShowCheckInSaveBar() {
  return true;
}

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
  if (summary.pending > 0) return summary.pending === 1 ? "Ainda falta 1 marcação" : `Ainda faltam ${summary.pending} marcações`;
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
  if (errorMessage) return "O aviso acima pode ajudar antes de salvar novamente.";
  if (summary.pending > 0) return `${checkInMarkedLabel(summary)}. Ainda há irmãos sem marcação antes de salvar.`;
  if (mode === "adjust" && !hasUnsavedChanges) return "Ainda não há alteração de presença ou visitante para salvar.";
  if (mode === "adjust") return "Tudo marcado. As mudanças já podem ser salvas.";

  return "Tudo marcado. A presença já pode ser salva.";
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
  onCancelAttempt,
  onSave,
}: CheckInSaveBarProps) {
  const showSaveBar = shouldShowCheckInSaveBar();

  if (!showSaveBar) {
    return null;
  }

  const title = saveBarTitle({ summary, mode, hasUnsavedChanges, isPending, errorMessage });
  const description = saveBarDescription({ summary, isPending, errorMessage, mode, hasUnsavedChanges });

  return (
    <FixedActionBar
      data-testid="check-in-save-bar"
      role="status"
      aria-live="polite"
      tone={!canSave && !isPending && !errorMessage ? "muted" : "default"}
    >
      <div className="grid gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto] min-[390px]:items-center">
        <div className="min-w-0">
          <p className="k-item-title-sm truncate">{title}</p>
          <p className="mt-0.5 text-[length:var(--text-xs)] leading-snug text-[color:var(--color-text-secondary)]">
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
              onClick={(event) => {
                if (onCancelAttempt && !onCancelAttempt()) event.preventDefault();
              }}
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
        <p role="alert" aria-live="assertive" className="k-inline-error mt-2">
          {errorMessage}
        </p>
      ) : null}
    </FixedActionBar>
  );
}
