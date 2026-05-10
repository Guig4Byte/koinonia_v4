import { SIGNAL_COPY, signalSupportActionCopyForStageCopy, signalSupportGuidanceCopy } from "./signal-copy";
import type { SignalSupportAction } from "./support-payload";

export { SIGNAL_SUPPORT_NOTE_MAX_LENGTH, signalSupportRequestPayload, type SignalSupportAction } from "./support-payload";
export type SignalSupportFlowStage = "idle" | "request-supervisor" | "escalate-pastor";
export type SignalSupportFormStage = Exclude<SignalSupportFlowStage, "idle">;

export const SIGNAL_SUPPORT_NOTE_PLACEHOLDER = SIGNAL_COPY.support.form.notePlaceholder;

export type SignalSupportActionCopy = {
  action: SignalSupportAction;
  title: string;
  detail: string;
  label: string;
};

export function isSignalSupportFormStage(stage: SignalSupportFlowStage): stage is SignalSupportFormStage {
  return stage !== "idle";
}

export function signalSupportActionCopyForStage(
  stage: SignalSupportFormStage,
  options: { canRequestSupervisor: boolean },
): SignalSupportActionCopy {
  return signalSupportActionCopyForStageCopy(stage, options);
}

export function signalSupportGuidance(canRequestSupervisor: boolean, canEscalatePastor: boolean) {
  return signalSupportGuidanceCopy(canRequestSupervisor, canEscalatePastor);
}

export function shouldShowSignalSupportActions(options: {
  assignmentMessage?: string | null;
  canRequestSupervisor: boolean;
  canEscalatePastor: boolean;
}) {
  return Boolean(options.assignmentMessage || options.canRequestSupervisor || options.canEscalatePastor);
}
