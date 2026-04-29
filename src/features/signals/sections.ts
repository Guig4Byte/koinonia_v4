import { PersonStatus, SignalSeverity, UserRole } from "../../generated/prisma/client";

export type PastoralSectionKey = "urgent" | "support" | "attention" | "care";

export type SectionSignalLike = {
  severity: SignalSeverity | string;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole | string } | null;
};

export type SectionPersonLike = {
  status: PersonStatus | string;
};

export type SectionViewerLike = {
  id: string;
  role: UserRole | string;
};

export function isUrgentOrPastoralCase(signal: SectionSignalLike): boolean {
  return (
    signal.severity === SignalSeverity.URGENT ||
    signal.assignedTo?.role === UserRole.PASTOR ||
    signal.assignedTo?.role === UserRole.ADMIN
  );
}

export function isSupportRequest(signal: SectionSignalLike, viewer: SectionViewerLike): boolean {
  if (isUrgentOrPastoralCase(signal)) return false;

  if (viewer.role === UserRole.SUPERVISOR) {
    return signal.assignedToId === viewer.id;
  }

  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isInCarePerson(person: SectionPersonLike): boolean {
  return person.status === PersonStatus.COOLING_AWAY;
}
