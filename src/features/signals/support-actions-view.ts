import type { SignalSupportAction } from "./support-payload";

export { SIGNAL_SUPPORT_NOTE_MAX_LENGTH, signalSupportRequestPayload, type SignalSupportAction } from "./support-payload";
export type SignalSupportFlowStage = "idle" | "request-supervisor" | "escalate-pastor";
export type SignalSupportFormStage = Exclude<SignalSupportFlowStage, "idle">;

export const SIGNAL_SUPPORT_NOTE_PLACEHOLDER = "Ex.: Tentei contato, mas ainda não consegui falar.";

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
  if (stage === "request-supervisor") {
    return {
      action: "REQUEST_SUPERVISOR",
      title: "Pedir apoio à supervisão?",
      detail: "A liderança continua acompanhando, mas a supervisão também verá este cuidado.",
      label: "Pedir apoio",
    };
  }

  return {
    action: "ESCALATE_PASTOR",
    title: "Encaminhar ao pastor?",
    detail: options.canRequestSupervisor
      ? "Use quando este cuidado pedir um olhar pastoral mais próximo ou envolver algo sensível. O caminho comum continua sendo pedir apoio à supervisão."
      : "Use quando este cuidado pedir um olhar pastoral mais próximo ou envolver algo sensível.",
    label: "Encaminhar",
  };
}

export function signalSupportGuidance(canRequestSupervisor: boolean, canEscalatePastor: boolean) {
  if (canRequestSupervisor && canEscalatePastor) {
    return "Pedir apoio à supervisão é o caminho comum. Encaminhe ao pastor quando o cuidado pedir um olhar pastoral mais próximo ou envolver algo sensível.";
  }

  if (canRequestSupervisor) {
    return "O apoio à supervisão ajuda quando o próximo gesto pede outra liderança. A responsabilidade local continua simples.";
  }

  if (canEscalatePastor) {
    return "O encaminhamento ao pastor fica para cuidados que pedem um olhar pastoral mais próximo ou envolvem algo sensível.";
  }

  return null;
}

export function shouldShowSignalSupportActions(options: {
  assignmentMessage?: string | null;
  canRequestSupervisor: boolean;
  canEscalatePastor: boolean;
}) {
  return Boolean(options.assignmentMessage || options.canRequestSupervisor || options.canEscalatePastor);
}

