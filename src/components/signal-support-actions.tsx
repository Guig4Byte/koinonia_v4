"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import {
  SignalSupportDecisionCard,
  SignalSupportFeedback,
  SignalSupportStartActions,
} from "@/components/signal-support-action-cards";
import {
  isSignalSupportFormStage,
  signalSupportActionCopyForStage,
  signalSupportGuidance,
  signalSupportRequestPayload,
  shouldShowSignalSupportActions,
  type SignalSupportAction,
  type SignalSupportFlowStage,
} from "@/features/signals/support-actions-view";
import { useApiAction } from "@/lib/use-api-action";
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
        fallbackErrorMessage: "Não foi possível pedir apoio agora.",
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
    <div className="mt-3 space-y-2 border-t border-[var(--color-border-divider)] pt-3">
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
