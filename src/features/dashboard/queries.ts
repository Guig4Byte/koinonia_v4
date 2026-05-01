import { endOfWeek, startOfWeek } from "date-fns";
import { MembershipRole, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../generated/prisma/client";
import { summarizeEventsPresence, isPresenceRecordedEvent } from "@/features/events/presence-summary";
import { canUsePastorDashboard, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson } from "@/features/signals/attention";
import { isSupportRequest } from "@/features/signals/sections";
import { prisma } from "@/lib/prisma";

const pastoralSignalWhere = {
  OR: [
    { severity: SignalSeverity.URGENT },
    { assignedTo: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
  ],
};

export async function getPastorDashboard(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorDashboard requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [events, openSignals, groups, inCarePeople] = await Promise.all([
    prisma.event.findMany({
      where: {
        churchId,
        type: "CELL_MEETING",
        startsAt: { gte: weekStart, lte: weekEnd },
        group: { is: { churchId, isActive: true } },
      },
      include: { attendances: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.careSignal.findMany({
      where: {
        churchId,
        status: SignalStatus.OPEN,
        AND: [
          pastoralSignalWhere,
          { OR: [{ groupId: null }, { group: { is: { churchId, isActive: true } } }] },
        ],
      },
      include: { person: true, assignedTo: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: [{ detectedAt: "desc" }],
      take: 50,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: {
        leader: true,
        supervisor: true,
        signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
        events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      where: {
        churchId,
        status: PersonStatus.COOLING_AWAY,
        memberships: { some: { leftAt: null, role: { not: MembershipRole.VISITOR }, group: { is: { churchId, isActive: true } } } },
        careTouches: { some: { actor: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } } },
      },
      include: {
        memberships: {
          where: { leftAt: null, role: { not: MembershipRole.VISITOR }, group: { is: { churchId, isActive: true } } },
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  const dueEvents = events.filter((event) => event.startsAt < tomorrow);
  const completedEvents = dueEvents.filter(isPresenceRecordedEvent);
  const presence = summarizeEventsPresence(completedEvents);
  const attentionPeople = getPastoralSignalsByPerson(openSignals);
  const urgentSignals = attentionPeople.length;

  const groupsWithPresence = groups.map((group) => {
    const groupPresence = summarizeEventsPresence(group.events);
    const recordedEvents = group.events.filter(isPresenceRecordedEvent);

    return {
      id: group.id,
      name: group.name,
      leaderName: group.leader?.name ?? "Sem líder",
      supervisorName: group.supervisor?.name ?? "Sem supervisor",
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      recordedEventsCount: recordedEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
      pastoralCasesCount: getPastoralSignalsByPerson(group.signals).length,
    };
  });

  const groupsWithoutRecentPresence = groupsWithPresence.filter((group) => !group.hasPresenceData);

  return {
    plannedEvents: dueEvents.length,
    completedEvents: completedEvents.length,
    pendingGroupsCount: groupsWithoutRecentPresence.length,
    groupsWithoutRecentPresence,
    presenceRate: presence.presenceRate,
    visitors: presence.visitorCount,
    hasPresenceData: presence.hasPresenceData,
    openSignals,
    attentionPeople,
    urgentSignals,
    inCarePeople,
    groups: groupsWithPresence,
  };
}

export async function getPastorTeamOverview(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorTeamOverview requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const LOW_PRESENCE_THRESHOLD = 70;

  const groupInclude = {
    leader: true,
    memberships: {
      where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
      include: { person: { select: { status: true } } },
    },
    signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
    events: { orderBy: { startsAt: "desc" as const }, take: 4, include: { attendances: true } },
  };

  const [supervisors, groupsWithoutSupervisor] = await Promise.all([
    prisma.user.findMany({
      where: { churchId, role: UserRole.SUPERVISOR },
      include: {
        groupsSupervised: {
          where: { churchId, isActive: true },
          include: groupInclude,
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true, supervisorUserId: null },
      include: groupInclude,
      orderBy: { name: "asc" },
    }),
  ]);

  const toTeamGroup = (group: typeof groupsWithoutSupervisor[number]) => {
    const presence = summarizeEventsPresence(group.events);
    const primarySignals = getPrimarySignalsByPerson(group.signals);
    const pastoralSignals = getPastoralSignalsByPerson(group.signals);
    const urgentCount = pastoralSignals.filter((signal) => signal.severity === SignalSeverity.URGENT).length;
    const supportRequestsCount = primarySignals.filter((signal) => signal.assignedTo?.role === UserRole.SUPERVISOR).length;
    const pastoralCasesCount = pastoralSignals.length;
    const attentionCount = primarySignals.length;
    const localAttentionCount = Math.max(attentionCount - pastoralCasesCount - supportRequestsCount, 0);
    const inCareCount = group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length;
    const hasLowPresence = presence.hasPresenceData && presence.presenceRate < LOW_PRESENCE_THRESHOLD;
    const hasNoPresenceData = !presence.hasPresenceData;
    const pastoralPriorityScore =
      urgentCount * 1000
      + Math.max(pastoralCasesCount - urgentCount, 0) * 700
      + supportRequestsCount * 350
      + localAttentionCount * 180
      + (hasLowPresence ? 100 + (LOW_PRESENCE_THRESHOLD - presence.presenceRate) : 0);
    const statusLabel = urgentCount > 0
      ? `${urgentCount} ${urgentCount === 1 ? "urgente" : "urgentes"}`
      : pastoralCasesCount > 0
        ? `${pastoralCasesCount} ${pastoralCasesCount === 1 ? "caso pastoral" : "casos pastorais"}`
        : supportRequestsCount > 0
          ? `${supportRequestsCount} ${supportRequestsCount === 1 ? "pedido de apoio" : "pedidos de apoio"}`
          : localAttentionCount > 0
            ? `${localAttentionCount} ${localAttentionCount === 1 ? "atenção local" : "atenções locais"}`
            : hasNoPresenceData
              ? "Sem presença recente"
              : hasLowPresence
                ? "Presença baixa"
                : "Estável";

    return {
      id: group.id,
      name: group.name,
      leadershipName: group.leader?.name ?? "não informada",
      membersCount: group.memberships.length,
      presenceRate: presence.presenceRate,
      hasPresenceData: presence.hasPresenceData,
      hasLowPresence,
      hasNoPresenceData,
      attentionCount,
      pastoralCasesCount,
      supportRequestsCount,
      localAttentionCount,
      urgentCount,
      inCareCount,
      pastoralPriorityScore,
      statusLabel,
    };
  };

  const compareTeamGroups = (left: ReturnType<typeof toTeamGroup>, right: ReturnType<typeof toTeamGroup>) => {
    const scoreDifference = right.pastoralPriorityScore - left.pastoralPriorityScore;
    if (scoreDifference !== 0) return scoreDifference;

    return left.name.localeCompare(right.name, "pt-BR");
  };

  const supervisorTeams = supervisors.map((supervisor) => {
    const groups = supervisor.groupsSupervised.map(toTeamGroup).sort(compareTeamGroups);
    const highestPriorityScore = groups[0]?.pastoralPriorityScore ?? 0;
    const groupsNeedingAttentionCount = groups.filter((group) => group.pastoralPriorityScore > 0).length;
    const pastoralCasesCount = groups.reduce((total, group) => total + group.pastoralCasesCount, 0);
    const urgentCount = groups.reduce((total, group) => total + group.urgentCount, 0);
    const attentionCount = groups.reduce((total, group) => total + group.attentionCount, 0);
    const groupsWithoutPresenceCount = groups.filter((group) => !group.hasPresenceData).length;
    const lowPresenceGroupsCount = groups.filter((group) => group.hasPresenceData && group.presenceRate < LOW_PRESENCE_THRESHOLD).length;

    return {
      id: supervisor.id,
      name: supervisor.name,
      email: supervisor.email,
      groups,
      highestPriorityScore,
      groupsNeedingAttentionCount,
      pastoralCasesCount,
      urgentCount,
      attentionCount,
      groupsWithoutPresenceCount,
      lowPresenceGroupsCount,
    };
  }).sort((left, right) => {
    const scoreDifference = right.highestPriorityScore - left.highestPriorityScore;
    if (scoreDifference !== 0) return scoreDifference;

    const attentionDifference = right.groupsNeedingAttentionCount - left.groupsNeedingAttentionCount;
    if (attentionDifference !== 0) return attentionDifference;

    return left.name.localeCompare(right.name, "pt-BR");
  });
  const unassignedGroups = groupsWithoutSupervisor.map(toTeamGroup).sort(compareTeamGroups);
  const allGroups = [...supervisorTeams.flatMap((supervisor) => supervisor.groups), ...unassignedGroups];
  const priorityGroups = allGroups.filter((group) => group.pastoralPriorityScore > 0).sort(compareTeamGroups);
  const readingPendingGroups = allGroups
    .filter((group) => group.hasNoPresenceData)
    .sort(compareTeamGroups);

  return {
    supervisors: supervisorTeams,
    unassignedGroups,
    priorityGroups,
    readingPendingGroups,
    summary: {
      supervisorsCount: supervisors.length,
      groupsCount: allGroups.length,
      pastoralCasesCount: allGroups.reduce((total, group) => total + group.pastoralCasesCount, 0),
      urgentCount: allGroups.reduce((total, group) => total + group.urgentCount, 0),
      attentionCount: allGroups.reduce((total, group) => total + group.attentionCount, 0),
      groupsNeedingAttentionCount: priorityGroups.length,
      groupsWithPastoralCasesCount: allGroups.filter((group) => group.pastoralCasesCount > 0).length,
      groupsWithoutPresenceCount: allGroups.filter((group) => !group.hasPresenceData).length,
      lowPresenceGroupsCount: allGroups.filter((group) => group.hasPresenceData && group.presenceRate < LOW_PRESENCE_THRESHOLD).length,
      groupsWithoutSupervisorCount: unassignedGroups.length,
    },
  };
}

async function getGroupScopedDashboard(user: PermissionUser) {
  const groups = await prisma.smallGroup.findMany({
    where: getVisibleGroupWhere(user),
    include: {
      leader: true,
      supervisor: true,
      memberships: { where: { leftAt: null, role: { not: MembershipRole.VISITOR } }, include: { person: true } },
      signals: { where: { status: SignalStatus.OPEN }, include: { person: true, assignedTo: true } },
      events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
    },
    orderBy: { name: "asc" },
  });

  const events = groups.flatMap((group) => group.events);
  const recordedEvents = events.filter(isPresenceRecordedEvent);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const attentionPeople = getPrimarySignalsByPerson(signals);
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const delegatedToPastor = signals.filter((signal) => signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN);
  const presence = summarizeEventsPresence(recordedEvents);
  const groupsWithPresence = groups.map((group) => {
    const groupPresence = summarizeEventsPresence(group.events);
    const recordedGroupEvents = group.events.filter(isPresenceRecordedEvent);

    return {
      ...group,
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      recordedEventsCount: recordedGroupEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
      supportRequestsCount: getPrimarySignalsByPerson(group.signals).filter((signal) => isSupportRequest(signal, user)).length,
      inCareCount: group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length,
    };
  });

  return {
    groups: groupsWithPresence,
    events,
    signals,
    attentionPeople,
    supportRequests,
    delegatedToPastor,
    presenceRate: presence.presenceRate,
    hasPresenceData: presence.hasPresenceData,
    recordedEventsCount: recordedEvents.length,
    visitors: presence.visitorCount,
  };
}

export function getSupervisorDashboard(user: PermissionUser) {
  return getGroupScopedDashboard(user);
}

export function getLeaderDashboard(user: PermissionUser) {
  return getGroupScopedDashboard(user);
}

export async function getScopedDashboard(user: PermissionUser) {
  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    return getPastorDashboard(user);
  }

  if (user.role === UserRole.SUPERVISOR) {
    return getSupervisorDashboard(user);
  }

  return getLeaderDashboard(user);
}
