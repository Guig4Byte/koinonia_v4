import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { escalationStatusLabelForViewer, isAssignedToPastoralRole, isAssignedToSupervisor, type SignalAssigneeLike } from "./escalation";

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

function isPastoralViewer(viewer?: SignalDisplayViewerLike | null): boolean {
  return viewer?.role === UserRole.PASTOR || viewer?.role === UserRole.ADMIN;
}

export function signalBadgeForViewer(signal: SignalDisplayLike, viewer?: SignalDisplayViewerLike | null): SignalBadge {
  if (signal.severity === SignalSeverity.URGENT) {
    return { label: "Urgente", tone: "risk" as const };
  }

  if (isAssignedToSupervisor(signal)) {
    if (isPastoralViewer(viewer)) {
      return { label: "Atenção local", tone: "warn" as const };
    }

    const escalationLabel = viewer ? escalationStatusLabelForViewer(signal, viewer) : null;
    return { label: escalationLabel ?? "Pedido de apoio", tone: "support" as const };
  }

  if (isAssignedToPastoralRole(signal)) {
    return { label: isPastoralViewer(viewer) ? "Caso pastoral" : "Encaminhado", tone: "risk" as const };
  }

  if (isPastoralViewer(viewer)) {
    return { label: "Atenção local", tone: "warn" as const };
  }

  if (signal.severity === SignalSeverity.INFO) {
    return { label: "Informativo", tone: "info" as const };
  }

  return { label: "Em atenção", tone: "warn" as const };
}

export function groupAttentionLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function signalReasonForViewer(reason: string, viewer: { role: UserRole }): string {
  if (viewer.role !== UserRole.LEADER) return reason;
  return reason.replace("Líder pediu apoio da supervisão", "Apoio solicitado à supervisão");
}
