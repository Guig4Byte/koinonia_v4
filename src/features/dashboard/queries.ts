import { GroupResponsibilityRole, MembershipRole, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "@/generated/prisma/client";
import { summarizeEventsPresence, summarizePresenceTrend, isPresenceRecordedEvent } from "@/features/events/presence-summary";
import {
  hasLowPresence,
  teamGroupPastoralPriorityScore,
  teamGroupStatusLabel,
} from "@/features/groups/group-pastoral-priority";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { canUsePastorDashboard, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson } from "@/features/signals/attention";
import { getPastoralSectionSignalsByPerson, isSupportRequest } from "@/features/signals/sections";
import { prisma } from "@/lib/prisma";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";

const PT_BR_LOCALE = "pt-BR";

const pastoralSignalWhere = {
  OR: [
    { severity: SignalSeverity.URGENT },
    { assignedTo: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
  ],
};

const activeGroupResponsibilityInclude = {
  where: { activeUntil: null },
  include: { user: true },
  orderBy: { createdAt: "asc" as const },
};

type PresenceThresholdSummary = {
  hasPresenceData: boolean;
  presenceRate: number;
};

type PastoralPriorityItem = {
  name: string;
  pastoralPriorityScore: number;
};

type SupervisorPriorityItem = {
  name: string;
  highestPriorityScore: number;
  groupsNeedingAttentionCount: number;
};

function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function compareByName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, PT_BR_LOCALE);
}

function comparePastoralPriorityThenName<T extends PastoralPriorityItem>(left: T, right: T) {
  const scoreDifference = right.pastoralPriorityScore - left.pastoralPriorityScore;
  if (scoreDifference !== 0) return scoreDifference;

  return compareByName(left, right);
}

function compareSupervisorPriority(left: SupervisorPriorityItem, right: SupervisorPriorityItem) {
  const scoreDifference = right.highestPriorityScore - left.highestPriorityScore;
  if (scoreDifference !== 0) return scoreDifference;

  const attentionDifference = right.groupsNeedingAttentionCount - left.groupsNeedingAttentionCount;
  if (attentionDifference !== 0) return attentionDifference;

  return compareByName(left, right);
}

function countGroupsWithoutPresence<T extends { hasPresenceData: boolean }>(groups: T[]) {
  return groups.filter((group) => !group.hasPresenceData).length;
}

function countLowPresenceGroups<T extends PresenceThresholdSummary>(groups: T[]) {
  return groups.filter(hasLowPresence).length;
}

export async function getPastorDashboard(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorDashboard requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const weekStart = startOfBrasiliaWeek(now, 1);
  const weekEnd = endOfBrasiliaWeek(now, 1);
  const tomorrow = addBrasiliaDays(startOfBrasiliaDay(now), 1);

  const [events, openSignals, groups, inCarePeople] = await Promise.all([
    prisma.event.findMany({
      where: {
        churchId,
        type: "CELL_MEETING",
        startsAt: { gte: weekStart, lte: weekEnd },
        group: { is: { churchId, isActive: true } },
      },
      include: { attendances: true, group: { include: { leader: true, supervisor: true, responsibilities: activeGroupResponsibilityInclude } } },
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
      include: { person: true, assignedTo: true, group: { include: { leader: true, supervisor: true, responsibilities: activeGroupResponsibilityInclude } } },
      orderBy: [{ detectedAt: "desc" }],
      take: 50,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: {
        leader: true,
        supervisor: true,
        responsibilities: activeGroupResponsibilityInclude,
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
    const primarySignals = getPrimarySignalsByPerson(group.signals);
    const pastoralSignals = getPastoralSignalsByPerson(group.signals);

    return {
      id: group.id,
      name: group.name,
      leaderName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "Sem liderança"),
      supervisorName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, group.supervisor?.name ?? "Sem supervisão"),
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      recordedEventsCount: recordedEvents.length,
      attentionCount: primarySignals.length,
      pastoralCasesCount: pastoralSignals.length,
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

  const groupInclude = {
    leader: true,
    supervisor: true,
    responsibilities: activeGroupResponsibilityInclude,
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
        groupResponsibilities: {
          where: {
            churchId,
            role: GroupResponsibilityRole.SUPERVISOR,
            activeUntil: null,
            group: { is: { churchId, isActive: true } },
          },
          include: {
            group: {
              include: groupInclude,
            },
          },
          orderBy: { createdAt: "asc" },
        },
        groupsSupervised: {
          where: { churchId, isActive: true },
          include: groupInclude,
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.smallGroup.findMany({
      where: {
        churchId,
        isActive: true,
        supervisorUserId: null,
        responsibilities: { none: { role: GroupResponsibilityRole.SUPERVISOR, activeUntil: null } },
      },
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
    const hasLowPresenceValue = hasLowPresence(presence);
    const hasNoPresenceData = !presence.hasPresenceData;
    const pastoralPriorityScore = teamGroupPastoralPriorityScore({
      urgentCount,
      pastoralCasesCount,
      hasPresenceData: presence.hasPresenceData,
      presenceRate: presence.presenceRate,
    });
    const statusLabel = teamGroupStatusLabel({
      urgentCount,
      pastoralCasesCount,
      hasNoPresenceData,
      hasLowPresence: hasLowPresenceValue,
    });

    return {
      id: group.id,
      name: group.name,
      leadershipName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "não informada"),
      membersCount: group.memberships.length,
      presenceRate: presence.presenceRate,
      hasPresenceData: presence.hasPresenceData,
      hasLowPresence: hasLowPresenceValue,
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

  const supervisorTeams = supervisors.map((supervisor) => {
    const groupsById = new Map<string, typeof groupsWithoutSupervisor[number]>();

    supervisor.groupResponsibilities.forEach((responsibility) => {
      groupsById.set(responsibility.group.id, responsibility.group);
    });

    supervisor.groupsSupervised.forEach((group) => {
      groupsById.set(group.id, group);
    });

    const groups = Array.from(groupsById.values()).map(toTeamGroup).sort(comparePastoralPriorityThenName);
    const highestPriorityScore = groups[0]?.pastoralPriorityScore ?? 0;
    const groupsNeedingAttentionCount = groups.filter((group) => group.pastoralPriorityScore > 0).length;
    const pastoralCasesCount = sumBy(groups, (group) => group.pastoralCasesCount);
    const urgentCount = sumBy(groups, (group) => group.urgentCount);
    const attentionCount = sumBy(groups, (group) => group.attentionCount);
    const groupsWithoutPresenceCount = countGroupsWithoutPresence(groups);
    const lowPresenceGroupsCount = countLowPresenceGroups(groups);

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
  }).sort(compareSupervisorPriority);
  const unassignedGroups = groupsWithoutSupervisor.map(toTeamGroup).sort(comparePastoralPriorityThenName);
  const allGroups = [...supervisorTeams.flatMap((supervisor) => supervisor.groups), ...unassignedGroups];
  const priorityGroups = allGroups.filter((group) => group.pastoralPriorityScore > 0).sort(comparePastoralPriorityThenName);
  const readingPendingGroups = allGroups
    .filter((group) => group.hasNoPresenceData)
    .sort(comparePastoralPriorityThenName);

  return {
    supervisors: supervisorTeams,
    unassignedGroups,
    priorityGroups,
    readingPendingGroups,
    summary: {
      supervisorsCount: supervisors.length,
      groupsCount: allGroups.length,
      pastoralCasesCount: sumBy(allGroups, (group) => group.pastoralCasesCount),
      urgentCount: sumBy(allGroups, (group) => group.urgentCount),
      attentionCount: sumBy(allGroups, (group) => group.attentionCount),
      groupsNeedingAttentionCount: priorityGroups.length,
      groupsWithPastoralCasesCount: allGroups.filter((group) => group.pastoralCasesCount > 0).length,
      groupsWithoutPresenceCount: countGroupsWithoutPresence(allGroups),
      lowPresenceGroupsCount: countLowPresenceGroups(allGroups),
      groupsWithoutSupervisorCount: unassignedGroups.length,
    },
  };
}

async function getGroupScopedDashboard(user: PermissionUser) {
  const now = new Date();
  const groups = await prisma.smallGroup.findMany({
    where: getVisibleGroupWhere(user),
    include: {
      leader: true,
      supervisor: true,
      responsibilities: activeGroupResponsibilityInclude,
      memberships: { where: { leftAt: null, role: { not: MembershipRole.VISITOR } }, include: { person: true } },
      signals: { where: { status: SignalStatus.OPEN }, include: { person: true, assignedTo: true } },
      events: { orderBy: { startsAt: "desc" }, take: 8, include: { attendances: true } },
    },
    orderBy: { name: "asc" },
  });

  const events = groups.flatMap((group) => group.events);
  const recordedEvents = events.filter(isPresenceRecordedEvent);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const attentionPeople = getPastoralSectionSignalsByPerson(signals, user);
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const delegatedToPastor = signals.filter((signal) => signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN);
  const presence = summarizeEventsPresence(recordedEvents);
  const groupsWithPresence = groups.map((group) => {
    const recordedGroupEvents = group.events.filter((event) => event.startsAt <= now && isPresenceRecordedEvent(event));
    const recentGroupEvents = recordedGroupEvents.slice(0, 4);
    const previousGroupEvents = recordedGroupEvents.slice(4, 8);
    const groupPresence = summarizeEventsPresence(recentGroupEvents);
    const previousGroupPresence = summarizeEventsPresence(previousGroupEvents);
    const groupAttentionSignals = getPastoralSectionSignalsByPerson(group.signals, user);

    return {
      ...group,
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      presenceTrend: summarizePresenceTrend(groupPresence, previousGroupPresence),
      recordedEventsCount: recordedGroupEvents.length,
      attentionCount: groupAttentionSignals.length,
      supportRequestsCount: groupAttentionSignals.filter((signal) => isSupportRequest(signal, user)).length,
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
