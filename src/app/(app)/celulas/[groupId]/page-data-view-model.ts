import { GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import {
  isPresenceRecordedEvent,
  splitPresenceTrendSamples,
  summarizeEventsPresence,
  summarizePresenceTrend,
} from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import type { GroupDetailSummaryCardData } from "@/features/groups/components/group-detail-summary-card";
import type { GroupPendingEvent } from "@/features/groups/components/group-pending-event-card";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  groupDetailFocusCard,
  groupPastoralPulse,
  readGroupDetailFocus,
} from "@/features/groups/group-detail-view";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole } from "@/features/navigation/app-nav";
import { leaderCellHrefFromGroup } from "@/features/navigation/leader-cell-nav";
import { readMembersFilter } from "@/features/people/member-filters";
import { isInCarePerson } from "@/features/people/person-status";
import { canManageGroups, isGroupLeader, type PermissionUser } from "@/features/permissions/permissions";
import {
  getPastoralSectionSignalsByPerson,
  isSupportRequest,
  isUrgentOrPastoralCase,
} from "@/features/signals/sections";
import { readTeamFilter } from "@/features/team/team-filters";
import { teamFilterBackHref } from "@/features/team/team-view";
import { countLabel } from "@/lib/format";
import { FILTER_ATTENTION, FILTER_IN_CARE } from "@/lib/filter-param";
import { firstParam } from "@/lib/search-params";
import type { GroupDetailRecord, GroupPresenceEvent } from "./page-data.queries";

type GroupDetailSearchParams = Record<string, string | string[] | undefined>;

type GroupDetailPageOptions = ReturnType<typeof readGroupDetailPageOptions>;

export function readGroupDetailPageOptions(queryParams: GroupDetailSearchParams) {
  const activeFocus = readGroupDetailFocus(firstParam(queryParams.foco));
  const requestedMembersFilter = firstParam(queryParams.membros);
  const activeMembersFilter = requestedMembersFilter
    ? readMembersFilter(requestedMembersFilter)
    : activeFocus === FILTER_IN_CARE
      ? FILTER_IN_CARE
      : FILTER_ATTENTION;

  return {
    activeFocus,
    activeMembersFilter,
    referenceDate: new Date(),
    savedParam: firstParam(queryParams.salvo),
    sourceParam: firstParam(queryParams.from),
    teamFilter: readTeamFilter(firstParam(queryParams.filtro)),
  };
}

export function buildGroupDetailPageModel({
  user,
  group,
  presenceEvents,
  options,
}: {
  user: PermissionUser;
  group: GroupDetailRecord;
  presenceEvents: GroupPresenceEvent[];
  options: GroupDetailPageOptions;
}) {
  const {
    activeFocus,
    activeMembersFilter,
    referenceDate,
    savedParam,
    sourceParam,
    teamFilter,
  } = options;
  const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, FALLBACK_LEADER_NAME);
  const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, "");

  const homeHref = homeHrefForRole(user.role);
  const isPastorView = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
  const isSupervisorView = user.role === UserRole.SUPERVISOR;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const shouldReturnToFilteredTeam = isPastorView && sourceParam === "equipe";
  const backHref = shouldReturnToFilteredTeam
    ? teamFilterBackHref(teamFilter)
    : isPastorView || isSupervisorView
      ? secondaryNavHref
      : homeHref;
  const backLabel = isPastorView ? "Voltar para equipe" : isSupervisorView ? "Voltar para células" : "Voltar para visão";

  const attentionPeople = getPastoralSectionSignalsByPerson(group.signals, user);
  const attentionSignalsByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const urgentOrPastoralSignals = attentionPeople.filter(isUrgentOrPastoralCase);
  const localAttentionCount = attentionPeople.length - urgentOrPastoralSignals.length - supportRequests.length;
  const inCareCount = group.memberships.filter((membership) => isInCarePerson(membership.person)).length;
  const hasRiskSignal = urgentOrPastoralSignals.length > 0;
  const navIndicator = hasRiskSignal ? "risk" : attentionPeople.length > 0 ? "attention" : inCareCount > 0 ? "care" : undefined;

  const recordedPresenceEvents = presenceEvents.filter(isPresenceRecordedEvent);
  const { recentItems: recentPresenceEvents, previousItems: previousPresenceEvents } = splitPresenceTrendSamples(recordedPresenceEvents);
  const completedEvents = recordedPresenceEvents;
  const presence = summarizeEventsPresence(recentPresenceEvents);
  const previousPresence = summarizeEventsPresence(previousPresenceEvents);
  const presenceTrend = summarizePresenceTrend(presence, previousPresence);
  const hasRecentPresence = presence.hasPresenceData;
  const relevantEvent = selectRelevantCheckInEvent<GroupDetailRecord["events"][number]>(group.events, referenceDate);
  const pendingEvent: GroupPendingEvent | null = relevantEvent && !hasRecordedPresence(relevantEvent)
    ? {
        id: relevantEvent.id,
        title: relevantEvent.title,
        startsAt: relevantEvent.startsAt,
      }
    : null;

  const pastoralPulse = groupPastoralPulse({
    role: user.role,
    urgentOrPastoralCount: urgentOrPastoralSignals.length,
    supportCount: supportRequests.length,
    localAttentionCount,
    inCareCount,
    hasRecentPresence,
    presenceRate: presence.presenceRate,
    hasPendingEvent: Boolean(pendingEvent),
  });

  const canRegisterPendingEvent = user.role === UserRole.LEADER && isGroupLeader(user, group);
  const pendingEventStatusLabel = canRegisterPendingEvent ? "Aguardando presença" : "Aguardando registro";
  const pendingEventActionLabel = canRegisterPendingEvent ? "Registrar presença" : "Abrir encontro";
  const members = buildGroupMemberDisplays({
    memberships: group.memberships,
    attentionSignalsByPersonId,
    viewer: user,
  });
  const membersView = buildGroupMembersView(members, activeMembersFilter, activeFocus);
  const focusCard = groupDetailFocusCard(activeFocus, membersView.focusedMembersCount);
  const canEditGroup = canManageGroups(user);
  const savedMessage = savedParam === "celula-criada"
    ? "Célula criada."
    : savedParam === "celula-atualizada"
      ? "Célula atualizada."
      : null;
  const recentPresenceEventsLabel = countLabel(
    recentPresenceEvents.length,
    "último encontro registrado",
    "últimos encontros registrados",
  );
  const recentPresenceDetail = recentPresenceEvents.length === 1
    ? "Média do último encontro registrado."
    : `Média dos ${recentPresenceEventsLabel}.`;
  const summaryCard: GroupDetailSummaryCardData = {
    members: {
      count: group.memberships.length,
      detail: "Membros sob cuidado e convivência desta célula.",
    },
    presence: {
      hasPresenceData: hasRecentPresence,
      value: formatPresenceRate(hasRecentPresence, presence.presenceRate),
      detail: hasRecentPresence
        ? recentPresenceDetail
        : "Ainda sem presença recente registrada.",
      tone: presenceTone(hasRecentPresence, presence.presenceRate),
      trend: presenceTrend,
    },
    attention: {
      label: isPastorView ? "Pedem cuidado" : "Pedem proximidade",
      count: attentionPeople.length,
      detail: attentionPeople.length > 0
        ? "Membros que merecem acompanhamento próximo."
        : "Nenhum sinal aberto pedindo cuidado agora.",
      tone: attentionPeople.length > 0 ? hasRiskSignal ? "risk" : "warn" : "ok",
    },
  };
  const leaderCellHref = leaderCellHrefFromGroup(user, group.id);

  return {
    activeFocus,
    activeMembersFilter,
    backHref,
    backLabel,
    canEditGroup,
    completedEvents,
    focusCard,
    group,
    leadershipName,
    membersView,
    nav: appNavForRole(user, { active: "secondary", indicator: navIndicator, secondaryHref: leaderCellHref }),
    pastoralPulse,
    pendingEvent,
    pendingEventActionLabel,
    pendingEventStatusLabel,
    savedMessage,
    summaryCard,
    supervisionName,
  };
}
