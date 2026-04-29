import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { isAssignedToPastoralRole, isAssignedToSupervisor, type SignalAssigneeLike } from "./escalation";

export type SignalBadgeTone = "neutral" | "ok" | "warn" | "risk" | "info" | "care";

export type SignalDisplayLike = {
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type SignalDisplayViewerLike = {
  id?: string | null;
  role: UserRole;
};

function isPastoralViewer(viewer?: SignalDisplayViewerLike | null) {
  return viewer?.role === UserRole.PASTOR || viewer?.role === UserRole.ADMIN;
}

export function signalBadgeForViewer(signal: SignalDisplayLike, viewer?: SignalDisplayViewerLike | null) {
  if (isAssignedToSupervisor(signal)) {
    if (isPastoralViewer(viewer)) {
      return signal.severity === SignalSeverity.URGENT
        ? { label: "Urgente", tone: "risk" as const }
        : { label: "Atenção local", tone: "warn" as const };
    }

    if (viewer?.role === UserRole.LEADER) {
      return { label: "Apoio solicitado", tone: "care" as const };
    }

    return { label: "Pedido de apoio", tone: "care" as const };
  }

  if (isAssignedToPastoralRole(signal)) {
    return { label: isPastoralViewer(viewer) ? "Caso pastoral" : "Encaminhado", tone: "risk" as const };
  }

  if (signal.severity === SignalSeverity.URGENT) {
    return { label: "Urgente", tone: "risk" as const };
  }

  if (isPastoralViewer(viewer)) {
    return { label: "Atenção local", tone: "warn" as const };
  }

  if (signal.severity === SignalSeverity.INFO) {
    return { label: "Informativo", tone: "info" as const };
  }

  return { label: "Em atenção", tone: "warn" as const };
}

export function groupAttentionLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
