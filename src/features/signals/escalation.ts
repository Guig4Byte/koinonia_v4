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

export function isAssignedToSupervisor(signal: EscalationSignalLike) {
  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isAssignedToPastoralRole(signal: EscalationSignalLike) {
  return signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN;
}

export function isPastoralEscalation(signal: EscalationSignalLike) {
  return signal.severity === SignalSeverity.URGENT || isAssignedToPastoralRole(signal);
}

export function escalationStatusLabel(signal: EscalationSignalLike) {
  if (isAssignedToPastoralRole(signal)) return "Encaminhado ao pastor";
  if (isAssignedToSupervisor(signal)) return "Apoio solicitado";
  return null;
}

function supervisorAssignmentLabelForViewer(viewer: EscalationViewerLike) {
  if (viewer.role === UserRole.SUPERVISOR) return "Pedido de apoio";
  return "Apoio solicitado";
}

export function shouldShowEscalationStatusForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike) {
  if (isAssignedToPastoralRole(signal)) return true;

  if (isAssignedToSupervisor(signal)) {
    return viewer.role === UserRole.LEADER || viewer.role === UserRole.SUPERVISOR;
  }

  return false;
}

export function escalationStatusLabelForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike) {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;
  if (isAssignedToSupervisor(signal)) return supervisorAssignmentLabelForViewer(viewer);
  return escalationStatusLabel(signal);
}

export function escalationStatusDetail(signal: EscalationSignalLike) {
  if (!signal.assignedTo) return null;

  if (isAssignedToPastoralRole(signal)) {
    return `${signal.assignedTo.name ?? "Pastor"} recebeu este caso para olhar mais de perto.`;
  }

  if (isAssignedToSupervisor(signal)) {
    return `${signal.assignedTo.name ?? "Supervisor"} recebeu este pedido de apoio.`;
  }

  return null;
}

export function escalationStatusDetailForViewer(signal: EscalationSignalLike, viewer: EscalationViewerLike) {
  if (!shouldShowEscalationStatusForViewer(signal, viewer)) return null;
  return escalationStatusDetail(signal);
}
