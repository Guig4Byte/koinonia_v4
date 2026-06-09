"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  SignalSupportDecisionCard,
  SignalSupportFeedback,
  SignalSupportStartActions,
} from "@/features/signals/components/signal-support-action-cards";
import {
  isSignalSupportFormStage,
  signalSupportActionCopyForStage,
  signalSupportGuidance,
  signalSupportRequestPayload,
  shouldShowSignalSupportActions,
  type SignalSupportAction,
  type SignalSupportFlowStage,
} from "@/features/signals/support-actions-view";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";
import { useApiAction } from "@/hooks/use-api-action";
import { API_ROUTES } from "@/lib/api-routes";

type SignalSupportActionsProps = {
  signalId: string;
  assignmentMessage?: string | null;
  canRequestSupervisor?: boolean;
  canEscalatePastor?: boolean;
};

export function SignalSupportActions({
  signalId,
  assignmentMessage,
  canRequestSupervisor = false,
  canEscalatePastor = false,
}: SignalSupportActionsProps) {
  const router = useRouter();
  const noteId = useId();
  const [stage, setStage] = useState<SignalSupportFlowStage>("idle");
  const [note, setNote] = useState("");
  const { isPending, errorMessage, clearError, runApiAction } = useApiAction();

  if (!shouldShowSignalSupportActions({ assignmentMessage, canRequestSupervisor, canEscalatePastor })) return null;

  function resetFlow() {
    setStage("idle");
    setNote("");
    clearError();
  }

  function send(action: SignalSupportAction) {
    runApiAction(
      () =>
        fetch(API_ROUTES.signalSupport(signalId), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(signalSupportRequestPayload(action, note)),
        }),
      {
        fallbackErrorMessage: SIGNAL_COPY.errors.supportFallback,
        onSuccess: () => {
          resetFlow();
          router.refresh();
        },
      },
    );
  }

  const guidance = signalSupportGuidance(canRequestSupervisor, canEscalatePastor);
  const actionCopy = isSignalSupportFormStage(stage)
    ? signalSupportActionCopyForStage(stage, { canRequestSupervisor })
    : null;

  return (
    <div className="k-divided-section space-y-2">
      <SignalSupportFeedback
        guidance={guidance}
        assignmentMessage={assignmentMessage ?? null}
        errorMessage={errorMessage}
      />

      {stage === "idle" ? (
        <SignalSupportStartActions
          canRequestSupervisor={canRequestSupervisor}
          canEscalatePastor={canEscalatePastor}
          isPending={isPending}
          onSelectStage={setStage}
        />
      ) : null}

      {actionCopy && isSignalSupportFormStage(stage) ? (
        <SignalSupportDecisionCard
          actionCopy={actionCopy}
          stage={stage}
          noteId={noteId}
          note={note}
          isPending={isPending}
          onNoteChange={setNote}
          onConfirm={() => send(actionCopy.action)}
          onCancel={resetFlow}
        />
      ) : null}
    </div>
  );
}
