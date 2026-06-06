import { GroupResponsibilityRole, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { SIGNAL_COPY, pastoralEscalationCopy, supervisorEscalationCopy } from "./signal-copy";
import {
  hasAnyGroupResponsibilityScope,
  hasGroupResponsibilityScope,
  type ResponsibleGroupLike,
} from "@/lib/domain/group-responsibilities";

export type SignalAssigneeLike = {
  id?: string | null;
  name?: string | null;
  role: UserRole | string;
};

export type SignalAssignmentLike = {
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type EscalationSignalLike = SignalAssignmentLike & {
  severity: SignalSeverity;
};

export type EscalationViewerLike = {
  id?: string | null;
  role: UserRole;
};

export type EscalationGroupLike = ResponsibleGroupLike;

export type EscalationScopedSignalLike = EscalationSignalLike & {
  group?: EscalationGroupLike | null;
};

export type EscalationAssignmentKind = "pastoral" | "supervisor";

export type EscalationDisplay = {
  label: string | null;
  detail: string | null;
  chip: string | null;
  visible: boolean;
};

function isSignalGroupLeader(viewer: EscalationViewerLike, group: EscalationGroupLike | null | undefined) {
  return hasGroupResponsibilityScope(group, viewer, GroupResponsibilityRole.LEADER);
}

function isSignalGroupSupervisor(viewer: EscalationViewerLike, group: EscalationGroupLike | null | undefined) {
  return hasGroupResponsibilityScope(group, viewer, GroupResponsibilityRole.SUPERVISOR);
}

function hasSupervisorAvailable(group: EscalationGroupLike | null | undefined) {
  return hasAnyGroupResponsibilityScope(group, GroupResponsibilityRole.SUPERVISOR);
}

function isSupervisorSupportViewer(viewer: EscalationViewerLike): boolean {
  return viewer.role === UserRole.LEADER || viewer.role === UserRole.SUPERVISOR;
}

function escalationAssignmentKind(signal: EscalationSignalLike): EscalationAssignmentKind | null {
  if (isAssignedToPastoralRole(signal)) return "pastoral";
  if (isAssignedToSupervisor(signal)) return "supervisor";
  return null;
}

function emptyEscalationDisplay(): EscalationDisplay {
  return {
    label: null,
    detail: null,
    chip: null,
    visible: false,
  };
}

function supervisorEscalationDisplay(viewer: EscalationViewerLike): EscalationDisplay {
  return {
    ...supervisorEscalationCopy(viewer),
    visible: true,
  };
}

function pastoralEscalationDisplay(viewer: EscalationViewerLike): EscalationDisplay {
  return {
    ...pastoralEscalationCopy(viewer),
    visible: true,
  };
}

export function isAssignedToSupervisor(signal: SignalAssignmentLike): boolean {
  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isAssignedToPastoralRole(signal: SignalAssignmentLike): boolean {
  return signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN;
}

export function isPastoralEscalation(signal: EscalationSignalLike): boolean {
  return signal.severity === SignalSeverity.URGENT || isAssignedToPastoralRole(signal);
}

export function escalationStatusLabel(signal: EscalationSignalLike): string | null {
  const assignmentKind = escalationAssignmentKind(signal);

  if (assignmentKind === "pastoral") return SIGNAL_COPY.pastoralEscalation.label;
  if (assignmentKind === "supervisor") return SIGNAL_COPY.support.requested.label;
  return null;
}

export function shouldShowEscalationStatusForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): boolean {
  const assignmentKind = escalationAssignmentKind(signal);

  if (assignmentKind === "pastoral") return true;
  if (assignmentKind === "supervisor") return isSupervisorSupportViewer(viewer);
  return false;
}

export function escalationDisplayForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): EscalationDisplay {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return emptyEscalationDisplay();

  const assignmentKind = escalationAssignmentKind(signal);

  if (assignmentKind === "supervisor") return supervisorEscalationDisplay(viewer);
  if (assignmentKind === "pastoral") return pastoralEscalationDisplay(viewer);

  return emptyEscalationDisplay();
}

export function escalationStatusLabelForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  return escalationDisplayForViewer(signal, viewer).label;
}

export function escalationStatusDetailForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  return escalationDisplayForViewer(signal, viewer).detail;
}

export function escalationStatusChipForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  return escalationDisplayForViewer(signal, viewer).chip;
}

export function canRequestSupervisorSupport(viewer: EscalationViewerLike, signal: EscalationScopedSignalLike): boolean {
  return Boolean(
    viewer.role === UserRole.LEADER
    && isSignalGroupLeader(viewer, signal.group)
    && hasSupervisorAvailable(signal.group)
    && !isAssignedToSupervisor(signal)
    && !isAssignedToPastoralRole(signal),
  );
}

export function canEscalateSignalToPastor(viewer: EscalationViewerLike, signal: EscalationScopedSignalLike): boolean {
  const isAllowedViewer = (
    (viewer.role === UserRole.LEADER && isSignalGroupLeader(viewer, signal.group))
    || (viewer.role === UserRole.SUPERVISOR && isSignalGroupSupervisor(viewer, signal.group))
  );

  return Boolean(isAllowedViewer && !isAssignedToPastoralRole(signal));
}
