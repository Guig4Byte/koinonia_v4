import { notFound } from "next/navigation";
import { EventType, GroupResponsibilityRole, MembershipRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import {
  isPresenceRecordedEvent,
  splitPresenceTrendSamples,
  summarizeEventsPresence,
  summarizePresenceTrend,
  type PresenceTrend,
} from "@/features/events/presence-summary";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  GROUP_DETAIL_EVENT_HISTORY_LIMIT,
  groupPastoralPulse,
} from "@/features/groups/group-detail-view";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole } from "@/features/navigation/app-nav";
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
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";

type GroupDetailSearchParams = Record<string, string | string[] | undefined>;

type ContextSummaryItem = {
  label: string;
  value: string;
  detail?: string;
  tone?: "ok" | "warn" | "risk" | "neutral";
  trend?: PresenceTrend | null;
};

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
  const savedParam = firstParam(queryParams.salvo);

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

  const leadershipName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, FALLBACK_LEADER_NAME);
  const supervisionName = responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, "");

  const referenceDate = new Date();
  const homeHref = homeHrefForRole(user.role);
  const isPastorView = user.role === UserRole.PASTOR || user.role === UserRole.ADMIN;
  const isSupervisorView = user.role === UserRole.SUPERVISOR;
  const secondaryNavHref = secondaryNavHrefForRole(user.role);
  const backHref = isPastorView || isSupervisorView ? secondaryNavHref : homeHref;
  const backLabel = isPastorView ? "Voltar para equipe" : isSupervisorView ? "Voltar para células" : "Voltar para visão";
  const attentionPeople = getPastoralSectionSignalsByPerson(group.signals, user);
  const attentionSignalsByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const urgentOrPastoralSignals = attentionPeople.filter(isUrgentOrPastoralCase);
  const localAttentionCount = attentionPeople.length - urgentOrPastoralSignals.length - supportRequests.length;
  const inCareCount = group.memberships.filter((membership) => isInCarePerson(membership.person)).length;
  const hasRiskSignal = urgentOrPastoralSignals.length > 0;
  const navIndicator = hasRiskSignal ? "risk" : attentionPeople.length > 0 ? "attention" : inCareCount > 0 ? "care" : undefined;
  const recordedPresenceEvents = group.events.filter((event) => event.startsAt <= referenceDate && isPresenceRecordedEvent(event));
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
  const membersView = buildGroupMembersView(members, activeMembersFilter);
  const canEditGroup = canManageGroups(user);
  const savedMessage = savedParam === "celula-criada"
    ? "Célula criada."
    : savedParam === "celula-atualizada"
      ? "Célula atualizada."
      : null;
  const summaryItems: ContextSummaryItem[] = [
    {
      label: "Membros acompanhados",
      value: String(group.memberships.length),
      detail: "Pessoas sob cuidado e convivência desta célula.",
      tone: "neutral",
    },
    {
      label: "Presença recente",
      value: formatPresenceRate(hasRecentPresence, presence.presenceRate),
      detail: hasRecentPresence
        ? "Média dos últimos encontros registrados."
        : "Ainda sem presença recente registrada.",
      tone: presenceTone(hasRecentPresence, presence.presenceRate),
      trend: presenceTrend,
    },
    {
      label: isPastorView ? "Pedem cuidado" : "Pedem proximidade",
      value: String(attentionPeople.length),
      detail: attentionPeople.length > 0
        ? "Pessoas que merecem acompanhamento próximo."
        : "Nenhum sinal aberto pedindo cuidado agora.",
      tone: attentionPeople.length > 0 ? hasRiskSignal ? "risk" : "warn" : "ok",
    },
  ];

  return {
    activeMembersFilter,
    backHref,
    backLabel,
    canEditGroup,
    completedEvents,
    group,
    leadershipName,
    membersView,
    nav: appNavForRole(user, { active: "secondary", indicator: navIndicator }),
    pastoralPulse,
    pendingEvent,
    pendingEventActionLabel,
    pendingEventStatusLabel,
    savedMessage,
    summaryItems,
    supervisionName,
  };
}
