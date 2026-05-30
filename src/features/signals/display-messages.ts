import { SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import { isPastoralRole } from "@/features/permissions/permissions";
import { SIGNAL_COPY, supportPastoralMessageCopy } from "./signal-copy";
import {
  isAssignedToPastoralRole,
  isAssignedToSupervisor,
  shouldShowEscalationStatusForViewer,
} from "./escalation";
import type { SignalDetailLike, SignalDisplayViewerLike, SignalPastoralMessage } from "./display-types";

function isAttendanceSignal(signal: SignalDetailLike): boolean {
  return signal.source === SignalSource.ATTENDANCE;
}

function supportPastoralMessage(viewer: SignalDisplayViewerLike): SignalPastoralMessage {
  return supportPastoralMessageCopy(viewer);
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
  if (isPastoralRole(viewer)) {
    const actorName = signal.pastoralEscalationActorName?.trim();

    return {
      title: SIGNAL_COPY.pastoralEscalation.requestedTitle,
      description: actorName
        ? SIGNAL_COPY.pastoralEscalation.requestedDescriptionWithActor(actorName)
        : SIGNAL_COPY.pastoralEscalation.requestedDescription,
    };
  }

  return {
    title: SIGNAL_COPY.pastoralEscalation.title,
    description: viewer.role === UserRole.LEADER
      ? SIGNAL_COPY.pastoralEscalation.leaderDescription
      : SIGNAL_COPY.pastoralEscalation.teamDescription,
  };
}

function urgentPastoralMessage(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  includeEvidence: boolean,
  useDetailedDescription: boolean,
): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = SIGNAL_COPY.messages.attendanceRecurring.compact;
    const detailDescription = isPastoralRole(viewer)
      ? SIGNAL_COPY.messages.attendanceRecurring.pastoralDetail
      : SIGNAL_COPY.messages.attendanceRecurring.localDetail;

    return {
      title: SIGNAL_COPY.messages.attendanceRecurring.title,
      description: withAttendanceEvidence(
        useDetailedDescription ? detailDescription : compactDescription,
        signal,
        includeEvidence,
      ),
    };
  }

  return {
    title: SIGNAL_COPY.messages.urgent.title,
    description: isPastoralRole(viewer)
      ? SIGNAL_COPY.messages.urgent.pastoralDescription
      : SIGNAL_COPY.messages.urgent.localDescription,
  };
}

function attentionPastoralMessage(
  signal: SignalDetailLike,
  viewer: SignalDisplayViewerLike,
  includeEvidence: boolean,
  useDetailedDescription: boolean,
): SignalPastoralMessage {
  if (isAttendanceSignal(signal)) {
    const compactDescription = SIGNAL_COPY.messages.attendanceRecent.compact;
    const detailDescription = viewer.role === UserRole.LEADER
      ? SIGNAL_COPY.messages.attendanceRecent.leaderDetail
      : SIGNAL_COPY.messages.attendanceRecent.teamDetail;

    return {
      title: SIGNAL_COPY.messages.attendanceRecent.title,
      description: withAttendanceEvidence(
        useDetailedDescription ? detailDescription : compactDescription,
        signal,
        includeEvidence,
      ),
    };
  }

  if (signal.source === SignalSource.NO_CONTACT) {
    return {
      title: SIGNAL_COPY.messages.noContact.title,
      description: SIGNAL_COPY.messages.noContact.description,
    };
  }

  if (signal.source === SignalSource.VISITOR) {
    return {
      title: SIGNAL_COPY.messages.visitor.title,
      description: SIGNAL_COPY.messages.visitor.description,
    };
  }

  return {
    title: SIGNAL_COPY.messages.attention.title,
    description: SIGNAL_COPY.messages.attention.description,
  };
}

function informationalPastoralMessage(): SignalPastoralMessage {
  return {
    title: SIGNAL_COPY.messages.informational.title,
    description: SIGNAL_COPY.messages.informational.description,
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
