import { SignalSeverity, UserRole } from "../../generated/prisma/client";

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

export type EscalationGroupLike = {
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
};

export type EscalationScopedSignalLike = EscalationSignalLike & {
  group?: EscalationGroupLike | null;
};

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

export function escalationStatusDetail(signal: EscalationSignalLike): string | null {
  if (!signal.assignedTo) return null;

  if (isAssignedToPastoralRole(signal)) {
    return `${signal.assignedTo.name ?? "Pastor"} recebeu este caso para olhar mais de perto.`;
  }

  if (isAssignedToSupervisor(signal)) {
    return `${signal.assignedTo.name ?? "Supervisor"} recebeu este pedido de apoio.`;
  }

  return null;
}

export function escalationStatusDetailForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike): string | null {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;
  return escalationStatusDetail(signal);
}

export function canRequestSupervisorSupport(viewer: EscalationViewerLike, signal: EscalationScopedSignalLike): boolean {
  return Boolean(
    viewer.role === UserRole.LEADER
    && viewer.id
    && signal.group?.leaderUserId === viewer.id
    && signal.group?.supervisorUserId
    && !isAssignedToSupervisor(signal)
    && !isAssignedToPastoralRole(signal),
  );
}

export function canEscalateSignalToPastor(viewer: EscalationViewerLike, signal: EscalationScopedSignalLike): boolean {
  return Boolean(
    viewer.role === UserRole.SUPERVISOR
    && viewer.id
    && signal.group?.supervisorUserId === viewer.id
    && !isAssignedToPastoralRole(signal),
  );
}
