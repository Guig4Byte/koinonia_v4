import { UserRole, type SignalSeverity, type PersonStatus } from "@/generated/prisma/client";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { splitPastoralSections } from "@/features/signals/sections";

export type PastorPageViewer = {
  id: string;
  role: UserRole;
};

export type PastorPageSignal = {
  id: string;
  personId: string;
  reason: string;
  severity: SignalSeverity;
  detectedAt?: Date;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole } | null;
  person: { id: string; fullName: string };
  group?: { name?: string | null; leader?: { name?: string | null } | null } | null;
};

export type PastorPageInCarePerson = {
  id: string;
  fullName: string;
  status: PersonStatus;
  memberships?: Array<{ group?: { name?: string | null } | null }>;
};

export type PastorPageDashboard = {
  attentionPeople: PastorPageSignal[];
  inCarePeople: PastorPageInCarePerson[];
  hasPresenceData: boolean;
  presenceRate: number;
};

type PresenceSummaryItem = {
  label: string;
  value: string;
  detail: string;
  tone: "ok" | "warn" | "risk" | "neutral";
};

export type PastorPageView = {
  navIndicator?: "risk" | "care";
  pastoralPulse: PastoralPulseMessage;
  urgentOrPastoralCases: PastorPageSignal[];
  inCarePeople: PastorPageInCarePerson[];
  presenceSummary: PresenceSummaryItem[];
};

function pastorPresenceTone(hasPresenceData: boolean, presenceRate: number): PresenceSummaryItem["tone"] {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < 65) return "risk";
  if (presenceRate < 75) return "warn";
  return "ok";
}

export function buildPastorPageView({
  dashboard,
  user,
}: {
  dashboard: PastorPageDashboard;
  user: PastorPageViewer;
}): PastorPageView {
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: dashboard.inCarePeople,
    viewer: user,
  });
  const urgentOrPastoralCases = pastoralSections.urgentOrPastoralCases;
  const inCarePeople = pastoralSections.inCarePeople;
  const primaryPastoralCase = urgentOrPastoralCases[0];
  const primaryInCarePerson = inCarePeople[0];

  return {
    navIndicator: urgentOrPastoralCases.length > 0 ? "risk" : inCarePeople.length > 0 ? "care" : undefined,
    pastoralPulse: buildPastoralPulseMessage({
      viewerRole: user.role,
      scope: "pastorDashboard",
      counts: {
        urgentOrPastoral: urgentOrPastoralCases.length,
        inCare: urgentOrPastoralCases.length > 0 ? 0 : inCarePeople.length,
      },
      subjects: {
        urgentOrPastoral: primaryPastoralCase ? { personName: primaryPastoralCase.person.fullName, groupName: primaryPastoralCase.group?.name ?? undefined } : null,
        inCare: primaryInCarePerson ? { personName: primaryInCarePerson.fullName } : null,
      },
    }),
    urgentOrPastoralCases,
    inCarePeople,
    presenceSummary: [
      {
        label: "Presença da semana",
        value: dashboard.hasPresenceData ? `${dashboard.presenceRate}%` : "—",
        detail: dashboard.hasPresenceData ? "Média dos encontros registrados nesta semana." : "Nenhum encontro registrado nesta semana.",
        tone: pastorPresenceTone(dashboard.hasPresenceData, dashboard.presenceRate),
      },
    ],
  };
}
