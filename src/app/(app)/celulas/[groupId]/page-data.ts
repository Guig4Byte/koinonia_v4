import { notFound } from "next/navigation";
import { EventType, GroupResponsibilityRole, MembershipRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import {
  isPresenceRecordedEvent,
  splitPresenceTrendSamples,
  summarizeEventsPresence,
  summarizePresenceTrend,
} from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  groupDetailFocusCard,
  GROUP_DETAIL_EVENT_HISTORY_LIMIT,
  groupPastoralPulse,
  readGroupDetailFocus,
} from "@/features/groups/group-detail-view";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole } from "@/features/navigation/app-nav";
import { readTeamFilter } from "@/features/team/team-filters";
import { teamFilterBackHref } from "@/features/team/team-view";
import { readMembersFilter } from "@/features/people/member-filters";
import { isInCarePerson } from "@/features/people/person-status";
import {
  canManageGroups,
  canViewGroup,
  isGroupLeader,
  type PermissionUser,
} from "@/features/permissions/permissions";
import {
  getPastoralSectionSignalsByPerson,
  isSupportRequest,
  isUrgentOrPastoralCase,
} from "@/features/signals/sections";
import type { GroupDetailSummaryCardData } from "@/features/groups/components/group-detail-summary-card";
import { countLabel } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";

type GroupDetailSearchParams = Record<string, string | string[] | undefined>;


export async function getGroupDetailPageData({
  user,
  groupId,
  queryParams,
}: {
  user: PermissionUser;
  groupId: string;
  queryParams: GroupDetailSearchParams;
}) {
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));
  const activeFocus = readGroupDetailFocus(firstParam(queryParams.foco));
  const sourceParam = firstParam(queryParams.from);
  const teamFilter = readTeamFilter(firstParam(queryParams.filtro));
  const savedParam = firstParam(queryParams.salvo);
  const referenceDate = new Date();

  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      responsibilities: activeGroupResponsibilitiesInclude,
      memberships: {
        where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
        include: { person: true },
        orderBy: { person: { fullName: "asc" } },
      },
      signals: {
        where: { status: SignalStatus.OPEN },
        include: { person: true, assignedTo: true },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      },
      events: {
        where: { type: EventType.CELL_MEETING },
        include: { attendances: true },
        orderBy: { startsAt: "desc" },
        take: GROUP_DETAIL_EVENT_HISTORY_LIMIT,
      },
    },
  });

  if (!group || !canViewGroup(user, group)) notFound();

  const presenceEvents = await prisma.event.findMany({
    where: {
      churchId: group.churchId,
      groupId: group.id,
      ...presenceHistoryEventWhere(referenceDate),
    },
    include: { attendances: true },
    orderBy: { startsAt: "desc" },
    take: GROUP_DETAIL_EVENT_HISTORY_LIMIT,
  });

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
  const relevantEvent = selectRelevantCheckInEvent(group.events, referenceDate);
  const pendingEvent = relevantEvent && !hasRecordedPresence(relevantEvent) ? relevantEvent : null;
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
  const pendingEventStatusLabel = canRegisterPendingEvent ? "Presença pendente" : "Aguardando registro";
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
    nav: appNavForRole(user, { active: "secondary", indicator: navIndicator }),
    pastoralPulse,
    pendingEvent,
    pendingEventActionLabel,
    pendingEventStatusLabel,
    savedMessage,
    summaryCard,
    supervisionName,
  };
}
