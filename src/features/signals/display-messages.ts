import { SignalSeverity, SignalSource, UserRole } from "../../generated/prisma/client";
import {
  isAssignedToPastoralRole,
  isAssignedToSupervisor,
  shouldShowEscalationStatusForViewer,
} from "./escalation";
import type { SignalDetailLike, SignalDisplayViewerLike, SignalPastoralMessage } from "./display";

function isPastoralViewer(viewer?: SignalDisplayViewerLike | null): boolean {
  return viewer?.role === UserRole.PASTOR || viewer?.role === UserRole.ADMIN;
}

function isAttendanceSignal(signal: SignalDetailLike): boolean {
  return signal.source === SignalSource.ATTENDANCE;
}

function supportPastoralMessage(viewer: SignalDisplayViewerLike): SignalPastoralMessage {
  if (viewer.role === UserRole.SUPERVISOR) {
    return {
      title: "Pedido de apoio recebido.",
      description: "A liderança pediu ajuda para acompanhar este cuidado com mais proximidade.",
    };
  }

  if (viewer.role === UserRole.LEADER) {
    return {
      title: "Apoio solicitado à supervisão.",
      description: "Você continua perto da pessoa, com a supervisão caminhando junto.",
    };
  }

  return {
    title: "Apoio em andamento.",
    description: "Esse cuidado segue com liderança e supervisão; aparece aqui apenas como contexto da célula.",
  };
}

function attendanceEvidenceText(signal: SignalDetailLike): string | undefined {
  const evidence = signal.evidence?.trim();
  if (!evidence?.startsWith("Ausente")) return undefined;
  return evidence;
}

function withAttendanceEvidence(description: string, signal: SignalDetailLike, includeEvidence: boolean): string {
  if (!includeEvidence) return description;
  const evidence = attendanceEvidenceText(signal);
  return evidence ? `${description}\n${evidence}` : description;
}

function pastoralEscalationMessage(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
): SignalPastoralMessage {
  if (isPastoralViewer(viewer)) {
    const actorName = signal.pastoralEscalationActorName?.trim();

    return {
      title: "Cuidado pastoral solicitado.",
      description: actorName
        ? `${actorName} compartilhou este cuidado para um olhar mais próximo. Um contato pode ajudar a entender melhor o momento.`
        : "Há um contexto que pede um olhar mais próximo. Um contato pode ajudar a entender melhor o momento.",
    };
  }

  return {
    title: "Encaminhado ao pastor.",
    description: viewer.role === UserRole.LEADER
      ? "Você compartilhou este cuidado para um olhar pastoral mais próximo."
      : "Esse cuidado foi compartilhado para acompanhamento pastoral.",
  };
}

function urgentPastoralMessage(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  includeEvidence: boolean,
  useDetailedDescription: boolean,
): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = "Parece que houve ausências recorrentes sem justificativa registrada.";
    const detailDescription = isPastoralViewer(viewer)
      ? "Parece que houve ausências recorrentes sem justificativa registrada. A presença recente pede um olhar pastoral mais próximo, com calma e contexto."
      : "Parece que houve ausências recorrentes sem justificativa registrada. Talvez valha uma aproximação simples, com calma e proximidade.";

    return {
      title: "Ausência recorrente percebida.",
      description: withAttendanceEvidence(
        useDetailedDescription ? detailDescription : compactDescription,
        signal,
        includeEvidence,
      ),
    };
  }

  return {
    title: "Cuidado mais próximo.",
    description: isPastoralViewer(viewer)
      ? "Há um sinal sensível que vale olhar com calma antes de orientar a equipe."
      : "Há um sinal sensível que vale acompanhar com calma e proximidade.",
  };
}

function attentionPastoralMessage(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  includeEvidence: boolean,
  useDetailedDescription: boolean,
): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = "Parece que houve ausências sem justificativa registrada.";
    const detailDescription = viewer.role === UserRole.LEADER
      ? "Parece que houve ausências sem justificativa registrada. Talvez valha uma aproximação simples, sem tom de cobrança."
      : "Parece que houve ausências sem justificativa registrada. Pode ser um bom ponto de atenção para acompanhar o cuidado da célula.";

    return {
      title: "Ausência recente percebida.",
      description: withAttendanceEvidence(
        useDetailedDescription ? detailDescription : compactDescription,
        signal,
        includeEvidence,
      ),
    };
  }

  if (signal.source === SignalSource.NO_CONTACT) {
    return {
      title: "Vínculo pede proximidade.",
      description: "Pode ser um bom momento para retomar contato com calma.",
    };
  }

  if (signal.source === SignalSource.VISITOR) {
    return {
      title: "Pessoa para acolher com proximidade.",
      description: "Vale manter esse vínculo no radar com leveza.",
    };
  }

  return {
    title: "Cuidado percebido pela liderança.",
    description: "Há um contexto que vale acompanhar com calma.",
  };
}

function informationalPastoralMessage(): SignalPastoralMessage {
  return {
    title: "Informativo.",
    description: "Há um registro para contexto deste cuidado.",
  };
}

export function signalPastoralMessageForViewer(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  options: { includeEvidence?: boolean; useDetailedDescription?: boolean } = {},
): SignalPastoralMessage {
  const includeEvidence = options.includeEvidence ?? false;
  const useDetailedDescription = options.useDetailedDescription ?? includeEvidence;
  if (shouldShowEscalationStatusForViewer(signal, viewer)) {
    if (isAssignedToSupervisor(signal)) return supportPastoralMessage(viewer);
    if (isAssignedToPastoralRole(signal)) return pastoralEscalationMessage(signal, viewer);
  }

  if (signal.severity === SignalSeverity.URGENT) {
    return urgentPastoralMessage(signal, viewer, includeEvidence, useDetailedDescription);
  }

  if (signal.severity === SignalSeverity.INFO) {
    return informationalPastoralMessage();
  }

  return attentionPastoralMessage(signal, viewer, includeEvidence, useDetailedDescription);
}
