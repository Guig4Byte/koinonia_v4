import { PersonStatus, SignalSeverity, UserRole } from "../../generated/prisma/client";

export type PastoralSectionKey = "urgent" | "support" | "attention" | "care";

export type SectionSignalLike = {
  severity: SignalSeverity | string;
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

export function splitPastoralSignals<TSignal extends SectionSignalWithIdentity>(
  signals: TSignal[],
  viewer: SectionViewerLike,
): PastoralSignalSections<TSignal> {
  const urgentOrPastoralCases: TSignal[] = [];
  const supportRequests: TSignal[] = [];
  const localAttention: TSignal[] = [];
  const activeAttentionPersonIds = new Set<string>();

  for (const signal of signals) {
    activeAttentionPersonIds.add(signal.personId);

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
