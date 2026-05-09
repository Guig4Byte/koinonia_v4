import { EventType, GroupResponsibilityRole, MembershipRole, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "@/generated/prisma/client";
import { isPresenceRecordedEvent, PRESENCE_TREND_RECENT_SAMPLE_COUNT, PRESENCE_TREND_TOTAL_SAMPLE_COUNT, summarizeEventsPresence } from "@/features/events/presence-summary";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  LEADER_RELEVANT_EVENT_LIMIT,
  LEADER_RELEVANT_EVENT_LOOKBACK_DAYS,
  type LeaderCurrentEvent,
  type LeaderPageInCarePerson,
  type LeaderPageSignal,
} from "@/features/leader/leader-page-view";
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

const PASTORAL_SIGNAL_QUERY_LIMIT = 50;
const PASTOR_IN_CARE_PEOPLE_QUERY_LIMIT = 30;

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
        type: EventType.CELL_MEETING,
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
      take: PASTORAL_SIGNAL_QUERY_LIMIT,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: {
        leader: true,
        supervisor: true,
        responsibilities: activeGroupResponsibilityInclude,
        signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
        events: { orderBy: { startsAt: "desc" }, take: PRESENCE_TREND_RECENT_SAMPLE_COUNT, include: { attendances: true } },
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
      take: PASTOR_IN_CARE_PEOPLE_QUERY_LIMIT,
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
    events: { orderBy: { startsAt: "desc" as const }, take: PRESENCE_TREND_RECENT_SAMPLE_COUNT, include: { attendances: true } },
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
      events: { orderBy: { startsAt: "desc" }, take: PRESENCE_TREND_TOTAL_SAMPLE_COUNT, include: { attendances: true } },
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

export type LeaderDashboard = {
  attentionPeople: LeaderPageSignal[];
  inCarePeople: LeaderPageInCarePerson[];
  currentEvent: LeaderCurrentEvent | null;
};

export async function getLeaderDashboard(user: PermissionUser): Promise<LeaderDashboard> {
  const groupScoped = await getGroupScopedDashboard(user);
  const groupIds = groupScoped.groups.map((group) => group.id);
  const now = new Date();
  const today = startOfBrasiliaDay(now);
  const historyStart = addBrasiliaDays(today, -LEADER_RELEVANT_EVENT_LOOKBACK_DAYS);
  const tomorrow = addBrasiliaDays(today, 1);

  if (groupIds.length > 0) {
    await ensureUpcomingCellMeetingsForUser(user, { groupIds, referenceDate: now });
  }

  const visibleEvents = groupIds.length > 0
    ? await prisma.event.findMany({
        where: {
          groupId: { in: groupIds },
          type: EventType.CELL_MEETING,
          startsAt: { gte: historyStart, lt: tomorrow },
        },
        orderBy: { startsAt: "desc" },
        take: LEADER_RELEVANT_EVENT_LIMIT,
        include: {
          group: true,
          attendances: true,
        },
      })
    : [];

  const currentEvent = selectRelevantCheckInEvent(visibleEvents, now);
  const inCarePeople = groupScoped.groups.flatMap((group) =>
    group.memberships.map((membership) => ({ ...membership.person, groupName: group.name })),
  );

  const attentionPeople: LeaderPageSignal[] = groupScoped.attentionPeople.map((signal) => ({
    id: signal.id,
    personId: signal.personId,
    severity: signal.severity,
    detectedAt: signal.detectedAt,
    assignedToId: signal.assignedToId,
    assignedTo: signal.assignedTo,
    reason: signal.reason,
    evidence: signal.evidence,
    source: signal.source,
    person: signal.person,
  }));

  return {
    attentionPeople,
    inCarePeople,
    currentEvent,
  };
}
