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
