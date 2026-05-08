import { GroupResponsibilityRole, SignalSeverity, UserRole } from "../../generated/prisma/client";

export type SignalAssigneeLike = {
  id?: string | null;
  name?: string | null;
  role: UserRole;
};

export type EscalationSignalLike = {
  severity: SignalSeverity;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type EscalationViewerLike = {
  id?: string | null;
  role: UserRole;
};

export type EscalationGroupResponsibilityLike = {
  userId?: string | null;
  role?: GroupResponsibilityRole | string | null;
  activeUntil?: Date | string | null;
};

export type EscalationGroupLike = {
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
  responsibilities?: EscalationGroupResponsibilityLike[];
};

export type EscalationScopedSignalLike = EscalationSignalLike & {
  group?: EscalationGroupLike | null;
};

function isActiveResponsibility(responsibility: EscalationGroupResponsibilityLike) {
  return responsibility.activeUntil === null || responsibility.activeUntil === undefined;
}

function hasGroupResponsibility(group: EscalationGroupLike | null | undefined, viewer: EscalationViewerLike, role: GroupResponsibilityRole) {
  if (!viewer.id) return false;

  return (group?.responsibilities ?? [])
    .filter(isActiveResponsibility)
    .some((responsibility) => responsibility.userId === viewer.id && responsibility.role === role);
}

function hasAnyGroupResponsibility(group: EscalationGroupLike | null | undefined, role: GroupResponsibilityRole) {
  return (group?.responsibilities ?? [])
    .filter(isActiveResponsibility)
    .some((responsibility) => responsibility.role === role);
}

function isSignalGroupLeader(viewer: EscalationViewerLike, group: EscalationGroupLike | null | undefined) {
  return Boolean(
    viewer.id
    && (
      hasGroupResponsibility(group, viewer, GroupResponsibilityRole.LEADER)
      || group?.leaderUserId === viewer.id
    ),
  );
}

function isSignalGroupSupervisor(viewer: EscalationViewerLike, group: EscalationGroupLike | null | undefined) {
  return Boolean(
    viewer.id
    && (
      hasGroupResponsibility(group, viewer, GroupResponsibilityRole.SUPERVISOR)
      || group?.supervisorUserId === viewer.id
    ),
  );
}

function hasSupervisorAvailable(group: EscalationGroupLike | null | undefined) {
  return Boolean(hasAnyGroupResponsibility(group, GroupResponsibilityRole.SUPERVISOR) || group?.supervisorUserId);
}

export function isAssignedToSupervisor(signal: EscalationSignalLike): boolean {
  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isAssignedToPastoralRole(signal: EscalationSignalLike): boolean {
  return signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN;
}

export function isPastoralEscalation(signal: EscalationSignalLike): boolean {
  return signal.severity === SignalSeverity.URGENT || isAssignedToPastoralRole(signal);
}

export function escalationStatusLabel(signal: EscalationSignalLike): string | null {
  if (isAssignedToPastoralRole(signal)) return "Encaminhado ao pastor";
  if (isAssignedToSupervisor(signal)) return "Apoio solicitado";
  return null;
}

function supervisorAssignmentLabelForViewer(viewer: EscalationViewerLike): string {
  if (viewer.role === UserRole.SUPERVISOR) return "Pedido de apoio";
  return "Apoio solicitado";
}

export function shouldShowEscalationStatusForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): boolean {
  if (isAssignedToPastoralRole(signal)) return true;

  if (isAssignedToSupervisor(signal)) {
    return viewer.role === UserRole.LEADER || viewer.role === UserRole.SUPERVISOR;
  }

  return false;
}

export function escalationStatusLabelForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;
  if (isAssignedToSupervisor(signal)) return supervisorAssignmentLabelForViewer(viewer);
  return escalationStatusLabel(signal);
}

export function escalationStatusDetailForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;

  if (isAssignedToSupervisor(signal)) {
    if (viewer.role === UserRole.SUPERVISOR) return "Essa célula pediu apoio da supervisão.";
    return "Apoio solicitado à supervisão.";
  }

  if (isAssignedToPastoralRole(signal)) {
    if (viewer.role === UserRole.PASTOR || viewer.role === UserRole.ADMIN) {
      return "Encaminhado ao cuidado pastoral.";
    }

    return "Encaminhado ao pastor.";
  }

  return null;
}


export function escalationStatusChipForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;

  if (isAssignedToSupervisor(signal)) {
    return viewer.role === UserRole.SUPERVISOR ? "Pedido de apoio" : "Apoio solicitado";
  }

  if (isAssignedToPastoralRole(signal)) {
    return viewer.role === UserRole.PASTOR || viewer.role === UserRole.ADMIN
      ? "Cuidado pastoral"
      : "Encaminhado";
  }

  return null;
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
