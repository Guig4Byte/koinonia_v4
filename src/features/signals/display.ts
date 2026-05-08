import { SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import {
  escalationStatusLabelForViewer,
  isAssignedToPastoralRole,
  isAssignedToSupervisor,
  type SignalAssigneeLike,
} from "./escalation";
import { signalPastoralMessageForViewer } from "./display-messages";

export { signalPastoralMessageForViewer } from "./display-messages";

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
  pastoralEscalationActorName?: string | null;
};

export type SignalPastoralMessage = {
  title: string;
  description?: string;
};

function isPastoralViewer(viewer?: SignalDisplayViewerLike | null): boolean {
  return viewer?.role === UserRole.PASTOR || viewer?.role === UserRole.ADMIN;
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

export function signalDetailForViewer(signal: SignalDetailLike, viewer: SignalDisplayViewerLike): string {
  return signalPastoralMessageForViewer(signal, viewer).title;
}

export function signalDescriptionForViewer(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  options: { includeEvidence?: boolean; useDetailedDescription?: boolean } = {},
): string | undefined {
  return signalPastoralMessageForViewer(signal, viewer, options).description;
}
