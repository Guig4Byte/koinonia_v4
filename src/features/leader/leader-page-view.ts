import { hasRecordedPresence } from "@/features/events/relevant-event";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import { signalTitleForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import type {
  LeaderDashboard,
  LeaderCurrentEvent,
  LeaderPageInCarePerson,
  LeaderPageSignal,
  LeaderPageViewer,
} from "./leader-dashboard-types";

export { LEADER_RELEVANT_EVENT_LIMIT, LEADER_RELEVANT_EVENT_LOOKBACK_DAYS } from "./leader-dashboard-types";
export type {
  LeaderCurrentEvent,
  LeaderDashboard,
  LeaderPageInCarePerson,
  LeaderPageSignal,
  LeaderPageViewer,
} from "./leader-dashboard-types";

export type LeaderPastoralSections = ReturnType<typeof buildLeaderPastoralSections>;

export type LeaderPageView = LeaderPastoralSections & {
  navIndicator?: "risk" | "attention" | "care";
  hasPeopleInRadar: boolean;
  pastoralPulse: PastoralPulseMessage;
};

export type LeaderCurrentEventState = {
  groupName: string;
  locationName: string | null;
  badgeLabel: string;
  badgeTone: "ok" | "warn";
  description: string;
  ctaLabel: string;
};

export function buildLeaderPastoralSections({
  signals,
  inCarePeople,
  viewer,
}: {
  signals: LeaderPageSignal[];
  inCarePeople: LeaderPageInCarePerson[];
  viewer: LeaderPageViewer;
}) {
  const pastoralSections = splitPastoralSections({ signals, inCarePeople, viewer });
  const prioritySignals = [
    ...pastoralSections.urgentOrPastoralCases,
    ...pastoralSections.supportRequests,
    ...pastoralSections.localAttention,
  ];

  return {
    urgentSignals: pastoralSections.urgentOrPastoralCases,
    supportSignals: pastoralSections.supportRequests,
    attentionSignals: pastoralSections.localAttention,
    inCarePeople: pastoralSections.inCarePeople,
    prioritySignals,
  };
}

export function leaderNavIndicator({
  urgentCount,
  attentionCount,
  inCareCount,
}: {
  urgentCount: number;
  attentionCount: number;
  inCareCount: number;
}): LeaderPageView["navIndicator"] {
  if (urgentCount > 0) return "risk";
  if (attentionCount > 0) return "attention";
  if (inCareCount > 0) return "care";
  return undefined;
}

export function buildLeaderPastoralPulse({
  sections,
  viewer,
}: {
  sections: LeaderPastoralSections;
  viewer: LeaderPageViewer;
}): PastoralPulseMessage {
  const primaryUrgentSignal = sections.urgentSignals[0];
  const primarySupportSignal = sections.supportSignals[0];
  const primaryAttentionSignal = sections.attentionSignals[0];
  const primaryInCarePerson = sections.inCarePeople[0];

  return buildPastoralPulseMessage({
    viewerRole: viewer.role,
    scope: "leaderDashboard",
    counts: {
      urgentOrPastoral: sections.urgentSignals.length,
      support: sections.supportSignals.length,
      attention: sections.attentionSignals.length,
      inCare: sections.inCarePeople.length,
    },
    subjects: {
      urgentOrPastoral: primaryUrgentSignal
        ? { personName: primaryUrgentSignal.person.fullName, detail: signalTitleForViewer(primaryUrgentSignal, viewer) }
        : null,
      support: primarySupportSignal
        ? { personName: primarySupportSignal.person.fullName, detail: signalTitleForViewer(primarySupportSignal, viewer) }
        : null,
      attention: primaryAttentionSignal
        ? { personName: primaryAttentionSignal.person.fullName, detail: signalTitleForViewer(primaryAttentionSignal, viewer) }
        : null,
      inCare: primaryInCarePerson ? { personName: primaryInCarePerson.fullName } : null,
    },
  });
}

export function buildLeaderPageView({
  dashboard,
  viewer,
}: {
  dashboard: LeaderDashboard;
  viewer: LeaderPageViewer;
}): LeaderPageView {
  const sections = buildLeaderPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: dashboard.inCarePeople,
    viewer,
  });

  return {
    ...sections,
    hasPeopleInRadar: sections.prioritySignals.length > 0 || sections.inCarePeople.length > 0,
    navIndicator: leaderNavIndicator({
      urgentCount: sections.urgentSignals.length,
      attentionCount: dashboard.attentionPeople.length,
      inCareCount: sections.inCarePeople.length,
    }),
    pastoralPulse: buildLeaderPastoralPulse({ sections, viewer }),
  };
}

export function leaderCurrentEventState(event: LeaderCurrentEvent): LeaderCurrentEventState {
  const completed = hasRecordedPresence(event);

  return {
    groupName: event.group?.name ?? "Célula",
    locationName: event.locationName ?? event.group?.locationName ?? null,
    badgeLabel: completed ? "Presença registrada" : "Aguardando presença",
    badgeTone: completed ? "ok" : "warn",
    description: completed
      ? "A presença deste encontro já foi registrada. Ajuste somente se alguma marcação estiver errada."
      : "Quando o encontro acontecer, marque a presença com calma. Isso ajuda a lembrar quem pode precisar de cuidado.",
    ctaLabel: completed ? "Ver detalhes" : "Registrar presença",
  };
}
