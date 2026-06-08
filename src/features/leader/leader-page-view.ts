import { hasRecordedPresence } from "@/features/events/relevant-event";
import { formatShortDate, formatTime } from "@/lib/format";
import { ROUTES } from "@/lib/routes";
import { buildGroupSetupChecklist, type GroupSetupChecklist } from "@/features/groups/group-setup-checklist";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";
import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { buildLeaderFirstUseState, firstUsePulseForRole, type FirstUseState } from "@/features/pastoral-home/first-use-state";
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
  nextAction: NextPastoralAction | null;
  firstUseState: FirstUseState | null;
  setupChecklist: GroupSetupChecklist | null;
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

function compactEventContext(event: LeaderCurrentEvent) {
  return [
    event.group?.name ?? "Célula",
    event.locationName ?? event.group?.locationName ?? null,
  ].filter(Boolean).join(" · ");
}

export function buildLeaderNextPastoralAction({
  primaryGroupId,
  currentEvent,
}: Pick<LeaderDashboard, "primaryGroupId" | "currentEvent">): NextPastoralAction | null {
  if (currentEvent) {
    const completed = hasRecordedPresence(currentEvent);

    return {
      eyebrow: completed ? "Resumo do encontro" : "Próximo encontro",
      title: `${formatShortDate(currentEvent.startsAt)}, ${formatTime(currentEvent.startsAt)}`,
      detail: completed
        ? `${compactEventContext(currentEvent)}. A presença já foi registrada; confira o resumo se precisar ajustar algo.`
        : `${compactEventContext(currentEvent)}. Registre a presença quando o encontro acontecer.`,
      href: ROUTES.event(currentEvent.id),
      label: completed ? "Ver resumo" : "Registrar presença",
      tone: completed ? "ok" : "presence",
    };
  }

  if (!primaryGroupId) return null;

  return {
    eyebrow: "Rotina da célula",
    title: "Nenhum encontro para registrar agora.",
    detail: "Abra a célula para consultar membros, agenda e histórico quando precisar.",
    href: ROUTES.group(primaryGroupId),
    label: "Ver célula",
    tone: "ok",
  };
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

  const hasPeopleInRadar = sections.prioritySignals.length > 0 || sections.inCarePeople.length > 0;
  const firstUseState = buildLeaderFirstUseState({
    primaryGroupId: dashboard.primaryGroupId,
    currentEventId: dashboard.currentEvent?.id,
    hasRecordedMeetings: dashboard.hasRecordedMeetings,
    hasPeopleInRadar,
  });
  const setupChecklist = dashboard.primaryGroup && !dashboard.hasRecordedMeetings
    ? buildGroupSetupChecklist({
        group: dashboard.primaryGroup,
        currentEventId: dashboard.currentEvent?.id,
      })
    : null;

  return {
    ...sections,
    hasPeopleInRadar,
    navIndicator: leaderNavIndicator({
      urgentCount: sections.urgentSignals.length,
      attentionCount: dashboard.attentionPeople.length,
      inCareCount: sections.inCarePeople.length,
    }),
    pastoralPulse: firstUseState ? firstUsePulseForRole(viewer.role) : buildLeaderPastoralPulse({ sections, viewer }),
    nextAction: firstUseState ? null : buildLeaderNextPastoralAction(dashboard),
    firstUseState,
    setupChecklist,
  };
}
