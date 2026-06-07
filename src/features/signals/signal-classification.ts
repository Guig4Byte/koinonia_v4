import { SignalSeverity, UserRole } from "@/generated/prisma/client";

export type SignalAssigneeLike = {
  id?: string | null;
  name?: string | null;
  role?: UserRole | string | null;
};

export type SignalAssignmentLike = {
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export type SignalClassificationLike = SignalAssignmentLike & {
  severity?: SignalSeverity | string | null;
};

export type SignalViewerLike = {
  id?: string | null;
  role?: UserRole | string | null;
};

export type SignalAssignmentKind = "pastoral" | "supervisor";

export type SignalPastoralSectionKind = "urgent" | "support" | "attention";

export type SignalClassification = {
  assignmentKind: SignalAssignmentKind | null;
  pastoralSectionKind: SignalPastoralSectionKind;
  isUrgent: boolean;
  isAssignedToPastoralRole: boolean;
  isAssignedToSupervisor: boolean;
  isPastoralEscalation: boolean;
  isPastoralCase: boolean;
  isSupervisorSupport: boolean;
};

export function signalAssignmentKind(signal: SignalAssignmentLike): SignalAssignmentKind | null {
  if (isSignalAssignedToPastoralRole(signal)) return "pastoral";
  if (isSignalAssignedToSupervisor(signal)) return "supervisor";
  return null;
}

export function isSignalAssignedToSupervisor(signal: SignalAssignmentLike): boolean {
  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isSignalAssignedToPastoralRole(signal: SignalAssignmentLike): boolean {
  return signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN;
}

export function isUrgentSignal(signal: Pick<SignalClassificationLike, "severity">): boolean {
  return signal.severity === SignalSeverity.URGENT;
}

export function isPastoralEscalationSignal(signal: SignalClassificationLike): boolean {
  return isUrgentSignal(signal) || isSignalAssignedToPastoralRole(signal);
}

export function isPastoralCaseSignal(signal: SignalClassificationLike): boolean {
  return !isUrgentSignal(signal) && isSignalAssignedToPastoralRole(signal);
}

export function isSupervisorSupportSignal(signal: SignalClassificationLike): boolean {
  return isSignalAssignedToSupervisor(signal);
}

export function isUrgentOrPastoralCaseSignal(signal: SignalClassificationLike): boolean {
  return isUrgentSignal(signal) || isSignalAssignedToPastoralRole(signal);
}

export function isSupportRequestSignal(signal: SignalClassificationLike, viewer: SignalViewerLike): boolean {
  if (isUrgentOrPastoralCaseSignal(signal)) return false;

  if (viewer.role === UserRole.SUPERVISOR) {
    return signal.assignedToId === viewer.id;
  }

  return isSignalAssignedToSupervisor(signal);
}

export function signalPastoralSectionKind(
  signal: SignalClassificationLike,
  viewer: SignalViewerLike,
): SignalPastoralSectionKind {
  if (isUrgentOrPastoralCaseSignal(signal)) return "urgent";
  if (isSupportRequestSignal(signal, viewer)) return "support";
  return "attention";
}

export function classifySignal(
  signal: SignalClassificationLike,
  viewer: SignalViewerLike = {},
): SignalClassification {
  const assignmentKind = signalAssignmentKind(signal);
  const isUrgent = isUrgentSignal(signal);
  const isAssignedToPastoralRole = assignmentKind === "pastoral";
  const isAssignedToSupervisor = assignmentKind === "supervisor";
  const isPastoralEscalation = isUrgent || isAssignedToPastoralRole;

  return {
    assignmentKind,
    pastoralSectionKind: signalPastoralSectionKind(signal, viewer),
    isUrgent,
    isAssignedToPastoralRole,
    isAssignedToSupervisor,
    isPastoralEscalation,
    isPastoralCase: !isUrgent && isAssignedToPastoralRole,
    isSupervisorSupport: isAssignedToSupervisor,
  };
}
