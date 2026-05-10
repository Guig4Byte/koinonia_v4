import { ArrowLeft, LifeBuoy, SendHorizontal } from "lucide-react";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { TextareaField } from "@/components/ui/field";
import {
  SIGNAL_SUPPORT_NOTE_MAX_LENGTH,
  SIGNAL_SUPPORT_NOTE_PLACEHOLDER,
  type SignalSupportActionCopy,
  type SignalSupportFlowStage,
  type SignalSupportFormStage,
} from "@/features/signals/support-actions-view";

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
        <Feedback tone="support" compact className="font-semibold">
          {assignmentMessage}
        </Feedback>
      ) : null}
      {errorMessage ? (
        <Feedback tone="error" compact role="alert" ariaLive="assertive" className="font-semibold">
          {errorMessage}
        </Feedback>
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
        <Button type="button" variant="secondary" size="sm" fullWidth disabled={isPending} onClick={() => onSelectStage("request-supervisor")}>
          <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.requestSupervisor.startLabel}
        </Button>
      ) : null}

      {canEscalatePastor ? (
        <Button type="button" variant="dangerSoft" size="sm" fullWidth disabled={isPending} onClick={() => onSelectStage("escalate-pastor")}>
          <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.escalatePastor.startLabel}
        </Button>
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
    <ActionPanel title={actionCopy.title} description={actionCopy.detail}>
      <TextareaField
        id={noteId}
        label={SIGNAL_COPY.support.form.noteLabel}
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        rows={3}
        maxLength={SIGNAL_SUPPORT_NOTE_MAX_LENGTH}
        placeholder={SIGNAL_SUPPORT_NOTE_PLACEHOLDER}
        className="mb-2"
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button type="button" size="sm" fullWidth disabled={isPending} onClick={onConfirm}>
          {stage === "request-supervisor" ? (
            <LifeBuoy className="h-4 w-4" strokeWidth={2.2} />
          ) : (
            <SendHorizontal className="h-4 w-4" strokeWidth={2.2} />
          )}
          {isPending ? SIGNAL_COPY.support.form.savingLabel : actionCopy.label}
        </Button>
        <Button type="button" variant="secondary" size="sm" fullWidth disabled={isPending} onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          {SIGNAL_COPY.support.form.cancelLabel}
        </Button>
      </div>
    </ActionPanel>
  );
}
