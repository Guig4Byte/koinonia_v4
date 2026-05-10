import { ArrowLeft, LifeBuoy, SendHorizontal } from "lucide-react";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";
import { cn } from "@/lib/cn";
import {
  SIGNAL_SUPPORT_NOTE_MAX_LENGTH,
  SIGNAL_SUPPORT_NOTE_PLACEHOLDER,
  type SignalSupportActionCopy,
  type SignalSupportFlowStage,
  type SignalSupportFormStage,
} from "@/features/signals/support-actions-view";

const supportButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[var(--color-btn-secondary-border)] bg-[var(--color-btn-secondary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-secondary-text)] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

const supportPrimaryButtonClass =
  "inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-btn-primary-bg)] px-3 text-sm font-semibold text-[var(--color-btn-primary-text)] transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";

export function SignalSupportFeedback({
  guidance,
  assignmentMessage,
  errorMessage,
}: {
  guidance: string | null;
  assignmentMessage: string | null;
  errorMessage: string | null;
}) {
  return (
    <>
      {guidance ? (
        <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {guidance}
        </p>
      ) : null}
      {assignmentMessage ? (
        <p className="rounded-2xl border border-[var(--color-badge-apoio-border)] bg-[var(--color-badge-apoio-bg)] px-3 py-2 text-xs font-semibold leading-relaxed text-[var(--color-badge-apoio-text)]">
          {assignmentMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-2xl border border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-badge-risco-text)]">
          {errorMessage}
        </p>
      ) : null}
    </>
  );
}

export function SignalSupportStartActions({
  canRequestSupervisor,
  canEscalatePastor,
  isPending,
  onSelectStage,
}: {
  canRequestSupervisor: boolean;
  canEscalatePastor: boolean;
  isPending: boolean;
  onSelectStage: (stage: SignalSupportFlowStage) => void;
}) {
  return (
    <>
      {canRequestSupervisor ? (
        <button type="button" disabled={isPending} onClick={() => onSelectStage("request-supervisor")} className={supportButtonClass}>
          <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.requestSupervisor.startLabel}
        </button>
      ) : null}

      {canEscalatePastor ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSelectStage("escalate-pastor")}
          className={cn(supportButtonClass, "border-[var(--color-badge-risco-border)] bg-[var(--color-badge-risco-bg)] text-[var(--color-badge-risco-text)]")}
        >
          <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.escalatePastor.startLabel}
        </button>
      ) : null}
    </>
  );
}

export function SignalSupportDecisionCard({
  actionCopy,
  stage,
  noteId,
  note,
  isPending,
  onNoteChange,
  onConfirm,
  onCancel,
}: {
  actionCopy: SignalSupportActionCopy;
  stage: SignalSupportFormStage;
  noteId: string;
  note: string;
  isPending: boolean;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--surface-alt)] p-3">
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{actionCopy.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{actionCopy.detail}</p>

      <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor={noteId}>
        {SIGNAL_COPY.support.form.noteLabel}
      </label>
      <textarea
        id={noteId}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={3}
        maxLength={SIGNAL_SUPPORT_NOTE_MAX_LENGTH}
        placeholder={SIGNAL_SUPPORT_NOTE_PLACEHOLDER}
        className="mt-2 w-full resize-none rounded-xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] px-3 py-2 text-sm leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-brand)]"
      />

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" disabled={isPending} onClick={onConfirm} className={supportPrimaryButtonClass}>
          {stage === "request-supervisor" ? (
            <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
          )}
          {isPending ? SIGNAL_COPY.support.form.savingLabel : actionCopy.label}
        </button>
        <button type="button" disabled={isPending} onClick={onCancel} className={supportButtonClass}>
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.form.cancelLabel}
        </button>
      </div>
    </div>
  );
}
