import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { isAssignedToPastoralRole, isAssignedToSupervisor } from "./escalation";
import { compareSignalsBySeverityAndRecency } from "./ranking";

export type PastoralSectionKey = "urgent" | "support" | "attention" | "care";

export type SectionSignalLike = {
  severity: SignalSeverity | string;
  detectedAt?: Date;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole | string } | null;
};

export type SectionSignalWithIdentity = SectionSignalLike & {
  id: string;
  personId: string;
};

export type SectionPersonLike = {
  status: PersonStatus | string;
};

export type SectionPersonWithIdentity = SectionPersonLike & {
  id: string;
};

export type SectionViewerLike = {
  id: string;
  role: UserRole | string;
};

export type PastoralSignalSections<TSignal extends SectionSignalWithIdentity> = {
  urgentOrPastoralCases: TSignal[];
  supportRequests: TSignal[];
  localAttention: TSignal[];
  activeAttentionPersonIds: Set<string>;
};

export type PastoralSections<
  TSignal extends SectionSignalWithIdentity,
  TPerson extends SectionPersonWithIdentity,
> = PastoralSignalSections<TSignal> & {
  inCarePeople: TPerson[];
};

const sectionRank: Record<Exclude<PastoralSectionKey, "care">, number> = {
  urgent: 1,
  support: 2,
  attention: 3,
};

export function isUrgentOrPastoralCase(signal: SectionSignalLike): boolean {
  return signal.severity === SignalSeverity.URGENT || isAssignedToPastoralRole(signal);
}

export function isSupportRequest(signal: SectionSignalLike, viewer: SectionViewerLike): boolean {
  if (isUrgentOrPastoralCase(signal)) return false;

  if (viewer.role === UserRole.SUPERVISOR) {
    return signal.assignedToId === viewer.id;
  }

  return isAssignedToSupervisor(signal);
}

export function isInCarePerson(person: SectionPersonLike): boolean {
  return person.status === PersonStatus.COOLING_AWAY;
}

function signalSectionKey(signal: SectionSignalLike, viewer: SectionViewerLike): Exclude<PastoralSectionKey, "care"> {
  if (isUrgentOrPastoralCase(signal)) return "urgent";
  if (isSupportRequest(signal, viewer)) return "support";
  return "attention";
}

function compareSignalsWithinSection(left: SectionSignalLike, right: SectionSignalLike): number {
  return compareSignalsBySeverityAndRecency(left, right);
}

function compareSignalsForPastoralSection(
  left: SectionSignalWithIdentity,
  right: SectionSignalWithIdentity,
  viewer: SectionViewerLike,
): number {
  const sectionDifference = sectionRank[signalSectionKey(left, viewer)] - sectionRank[signalSectionKey(right, viewer)];
  if (sectionDifference !== 0) return sectionDifference;

  const sectionOrderDifference = compareSignalsWithinSection(left, right);
  if (sectionOrderDifference !== 0) return sectionOrderDifference;

  return left.id.localeCompare(right.id, "pt-BR");
}

export function sortSignalsForPastoralViewer<TSignal extends SectionSignalWithIdentity>(
  signals: TSignal[],
  viewer: SectionViewerLike,
): TSignal[] {
  return [...signals].sort((left, right) => compareSignalsForPastoralSection(left, right, viewer));
}

export function getPastoralSectionSignalsByPerson<TSignal extends SectionSignalWithIdentity>(
  signals: TSignal[],
  viewer: SectionViewerLike,
): TSignal[] {
  const selectedByPerson = new Map<string, TSignal>();

  for (const signal of signals) {
    const current = selectedByPerson.get(signal.personId);

    if (!current || compareSignalsForPastoralSection(signal, current, viewer) < 0) {
      selectedByPerson.set(signal.personId, signal);
    }
  }

  return sortSignalsForPastoralViewer(Array.from(selectedByPerson.values()), viewer);
}

export function splitPastoralSignals<TSignal extends SectionSignalWithIdentity>(
  signals: TSignal[],
  viewer: SectionViewerLike,
): PastoralSignalSections<TSignal> {
  const urgentOrPastoralCases: TSignal[] = [];
  const supportRequests: TSignal[] = [];
  const localAttention: TSignal[] = [];
  const activeAttentionPersonIds = new Set(signals.map((signal) => signal.personId));
  const selectedSignals = getPastoralSectionSignalsByPerson(signals, viewer);

  for (const signal of selectedSignals) {
    if (isUrgentOrPastoralCase(signal)) {
      urgentOrPastoralCases.push(signal);
      continue;
    }

    if (isSupportRequest(signal, viewer)) {
      supportRequests.push(signal);
      continue;
    }

    localAttention.push(signal);
  }

  return {
    urgentOrPastoralCases,
    supportRequests,
    localAttention,
    activeAttentionPersonIds,
  };
}

export function filterInCarePeople<TPerson extends SectionPersonWithIdentity>(
  people: TPerson[],
  activeAttentionPersonIds: Set<string>,
): TPerson[] {
  const seenPersonIds = new Set<string>();

  return people.filter((person) => {
    if (!isInCarePerson(person)) return false;
    if (activeAttentionPersonIds.has(person.id)) return false;
    if (seenPersonIds.has(person.id)) return false;

    seenPersonIds.add(person.id);
    return true;
  });
}

export function splitPastoralSections<
  TSignal extends SectionSignalWithIdentity,
  TPerson extends SectionPersonWithIdentity,
>({
  signals,
  inCarePeople,
  viewer,
}: {
  signals: TSignal[];
  inCarePeople: TPerson[];
  viewer: SectionViewerLike;
}): PastoralSections<TSignal, TPerson> {
  const signalSections = splitPastoralSignals(signals, viewer);

  return {
    ...signalSections,
    inCarePeople: filterInCarePeople(inCarePeople, signalSections.activeAttentionPersonIds),
  };
}
