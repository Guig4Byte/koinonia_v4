import { GroupResponsibilityRole, MembershipRole, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "@/generated/prisma/client";
import { summarizeEventsPresence, isPresenceRecordedEvent } from "@/features/events/presence-summary";
import { canUsePastorDashboard, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson } from "@/features/signals/attention";
import { getPastoralSectionSignalsByPerson, isSupportRequest } from "@/features/signals/sections";
import {
  buildPastorGroupPresence,
  buildPastorTeamGroup,
  buildScopedGroupDashboardItem,
  buildSupervisorTeam,
  comparePastoralPriorityThenName,
  compareSupervisorPriority,
  countGroupsWithoutPresence,
  countLowPresenceGroups,
  sumBy,
} from "@/features/dashboard/dashboard-view";
import { prisma } from "@/lib/prisma";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";

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

  const groupsWithPresence = groups.map(buildPastorGroupPresence);

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

  const toTeamGroup = buildPastorTeamGroup;

  const supervisorTeams = supervisors.map((supervisor) => buildSupervisorTeam({
    supervisor,
    responsibilityGroups: supervisor.groupResponsibilities.map((responsibility) => responsibility.group),
    legacyGroups: supervisor.groupsSupervised,
  })).sort(compareSupervisorPriority);
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
  const groupsWithPresence = groups.map((group) => buildScopedGroupDashboardItem(group, user, now));

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
