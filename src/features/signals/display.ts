import { SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import { isPastoralRole } from "@/features/permissions/permissions";
import {
  escalationStatusLabelForViewer,
  isAssignedToPastoralRole,
  isAssignedToSupervisor,
  type SignalAssigneeLike,
} from "./escalation";
import { signalPastoralMessageForViewer } from "./display-messages";
import { SIGNAL_COPY } from "./signal-copy";

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

/**
 * Resolves the user-facing signal badge for a specific viewer role.
 *
 * Urgency always wins over assignment labels so a severe case is never softened.
 */
export function signalBadgeForViewer(signal: SignalDisplayLike, viewer?: SignalDisplayViewerLike | null): SignalBadge {
  if (signal.severity === SignalSeverity.URGENT) {
    return { label: SIGNAL_COPY.badges.urgent, tone: "risk" };
  }

  if (isAssignedToSupervisor(signal)) {
    const escalationLabel = viewer ? escalationStatusLabelForViewer(signal, viewer) : null;
    return { label: escalationLabel ?? SIGNAL_COPY.badges.supportRequest, tone: "support" };
  }

  if (isAssignedToPastoralRole(signal)) {
    return { label: isPastoralRole(viewer) ? SIGNAL_COPY.badges.pastoralCase : SIGNAL_COPY.badges.escalated, tone: "risk" };
  }

  if (signal.severity === SignalSeverity.INFO) {
    return { label: SIGNAL_COPY.badges.informational, tone: "info" };
  }

  if (isPastoralRole(viewer)) {
    return { label: SIGNAL_COPY.badges.localAttention, tone: "warn" };
  }

  return { label: SIGNAL_COPY.badges.attention, tone: "warn" };
}

export function groupAttentionLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function signalReasonForViewer(reason: string, viewer: { role: UserRole }): string {
  if (viewer.role !== UserRole.LEADER) return reason;
  return reason.replace(SIGNAL_COPY.support.requested.rawLeaderReason, SIGNAL_COPY.support.requested.leaderReasonReplacement);
}

export function signalTitleForViewer(signal: SignalDetailLike, viewer: SignalDisplayViewerLike): string {
  return signalPastoralMessageForViewer(signal, viewer).title;
}

export function signalDescriptionForViewer(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  options: { includeEvidence?: boolean; useDetailedDescription?: boolean } = {},
): string | undefined {
  return signalPastoralMessageForViewer(signal, viewer, options).description;
}
