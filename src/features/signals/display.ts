import { SignalSeverity, SignalSource, UserRole } from "../../generated/prisma/client";
import {
  escalationStatusLabelForViewer,
  isAssignedToPastoralRole,
  isAssignedToSupervisor,
  shouldShowEscalationStatusForViewer,
  type SignalAssigneeLike,
} from "./escalation";

export type SignalBadgeTone = "neutral" | "ok" | "warn" | "risk" | "info" | "care" | "support";

export type SignalBadge = {
  label: string;
  tone: SignalBadgeTone;
};

export type SignalDisplayLike = {
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type SignalDisplayViewerLike = {
  id?: string | null;
  role: UserRole;
};

export type SignalDetailLike = SignalDisplayLike & {
  reason?: string | null;
  evidence?: string | null;
  source?: SignalSource | null;
};

export type SignalPastoralMessage = {
  title: string;
  description?: string;
};

function isPastoralViewer(viewer?: SignalDisplayViewerLike | null): boolean {
  return viewer?.role === UserRole.PASTOR || viewer?.role === UserRole.ADMIN;
}

function isAttendanceSignal(signal: SignalDetailLike): boolean {
  return signal.source === SignalSource.ATTENDANCE;
}

/**
 * Resolves the user-facing signal badge for a specific viewer role.
 *
 * Urgency always wins over assignment labels so a severe case is never softened.
 */
export function signalBadgeForViewer(signal: SignalDisplayLike, viewer?: SignalDisplayViewerLike | null): SignalBadge {
  if (signal.severity === SignalSeverity.URGENT) {
    return { label: "Urgente", tone: "risk" };
  }

  if (isAssignedToSupervisor(signal)) {
    if (isPastoralViewer(viewer)) {
      return { label: "Atenção local", tone: "warn" };
    }

    const escalationLabel = viewer ? escalationStatusLabelForViewer(signal, viewer) : null;
    return { label: escalationLabel ?? "Pedido de apoio", tone: "support" };
  }

  if (isAssignedToPastoralRole(signal)) {
    return { label: isPastoralViewer(viewer) ? "Caso pastoral" : "Encaminhado", tone: "risk" };
  }

  if (signal.severity === SignalSeverity.INFO) {
    return { label: "Informativo", tone: "info" };
  }

  if (isPastoralViewer(viewer)) {
    return { label: "Atenção local", tone: "warn" };
  }

  return { label: "Em atenção", tone: "warn" };
}

export function groupAttentionLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function signalReasonForViewer(reason: string, viewer: { role: UserRole }): string {
  if (viewer.role !== UserRole.LEADER) return reason;
  return reason.replace("Líder pediu apoio da supervisão", "Apoio solicitado à supervisão");
}

function supportPastoralMessage(viewer: SignalDisplayViewerLike): SignalPastoralMessage {
  if (viewer.role === UserRole.SUPERVISOR) {
    return {
      title: "Pedido de apoio da célula.",
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

function pastoralEscalationMessage(viewer: SignalDisplayViewerLike): SignalPastoralMessage {
  if (isPastoralViewer(viewer)) {
    return {
      title: "Encaminhado ao cuidado pastoral.",
      description: "Este cuidado pede um olhar pastoral mais próximo.",
    };
  }

  return {
    title: "Encaminhado ao pastor.",
    description: "Esse cuidado foi compartilhado para acompanhamento pastoral.",
  };
}

function urgentPastoralMessage(signal: SignalDetailLike, viewer: SignalDisplayViewerLike, includeEvidence: boolean): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = "Parece que houve ausências recorrentes sem justificativa registrada.";
    const detailDescription = isPastoralViewer(viewer)
      ? "Parece que houve ausências recorrentes sem justificativa registrada. A presença recente pede um olhar pastoral mais próximo, com calma e contexto."
      : "Parece que houve ausências recorrentes sem justificativa registrada. Pode ser um bom momento para cuidar mais de perto, com calma e proximidade.";

    return {
      title: "Ausência recorrente percebida.",
      description: withAttendanceEvidence(
        includeEvidence ? detailDescription : compactDescription,
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

function attentionPastoralMessage(signal: SignalDetailLike, viewer: SignalDisplayViewerLike, includeEvidence: boolean): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = "Parece que houve ausências sem justificativa registrada.";
    const detailDescription = viewer.role === UserRole.LEADER
      ? "Parece que houve ausências sem justificativa registrada. Talvez valha uma aproximação simples, sem tom de cobrança."
      : "Parece que houve ausências sem justificativa registrada. Pode ser um bom ponto de atenção para acompanhar o cuidado da célula.";

    return {
      title: "Ausência recente percebida.",
      description: withAttendanceEvidence(
        includeEvidence ? detailDescription : compactDescription,
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
  options: { includeEvidence?: boolean } = {},
): SignalPastoralMessage {
  const includeEvidence = options.includeEvidence ?? false;
  if (shouldShowEscalationStatusForViewer(signal, viewer)) {
    if (isAssignedToSupervisor(signal)) return supportPastoralMessage(viewer);
    if (isAssignedToPastoralRole(signal)) return pastoralEscalationMessage(viewer);
  }

  if (signal.severity === SignalSeverity.URGENT) {
    return urgentPastoralMessage(signal, viewer, includeEvidence);
  }

  if (signal.severity === SignalSeverity.INFO) {
    return informationalPastoralMessage();
  }

  return attentionPastoralMessage(signal, viewer, includeEvidence);
}

export function signalDetailForViewer(signal: SignalDetailLike, viewer: SignalDisplayViewerLike): string {
  return signalPastoralMessageForViewer(signal, viewer).title;
}

export function signalDescriptionForViewer(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  options: { includeEvidence?: boolean } = {},
): string | undefined {
  return signalPastoralMessageForViewer(signal, viewer, options).description;
}
