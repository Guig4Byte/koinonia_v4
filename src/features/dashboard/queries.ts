import { EventType, GroupKind, GroupResponsibilityRole, MembershipRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { isPresenceRecordedEvent, PRESENCE_TREND_RECENT_SAMPLE_COUNT, PRESENCE_TREND_TOTAL_SAMPLE_COUNT, summarizeEventsPresence, type PresenceEvent } from "@/features/events/presence-summary";
import { buildWeeklyPresenceMonthTrend, type WeeklyPresenceTrendPoint } from "@/features/dashboard/presence-health";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  LEADER_RELEVANT_EVENT_LIMIT,
  LEADER_RELEVANT_EVENT_LOOKBACK_DAYS,
  type LeaderCurrentEvent,
  type LeaderPageInCarePerson,
  type LeaderPageSignal,
} from "@/features/leader/leader-page-view";
import { activeGroupResponsibilitiesInclude, activeGroupResponsibilityWhere } from "@/features/groups/group-query";
import { canUsePastorDashboard, getVisibleEventWhere, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSectionSignalsByPerson } from "@/features/signals/sections";
import {
  buildPastorTeamGroup,
  buildScopedGroupDashboardItem,
  buildSupervisorTeam,
  comparePastoralPriorityThenName,
  compareSupervisorPriority,
  countGroupsWithoutPresence,
  countLowPresenceGroups,
  sumBy,
} from "@/features/dashboard/dashboard-view";
import { buildPastoralHealthOverview } from "@/features/dashboard/pastoral-health";
import { prisma } from "@/lib/prisma";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";


const PASTOR_PRESENCE_TREND_WEEK_LABELS = ["-4 sem", "-3 sem", "-2 sem", "-1 sem"] as const;

function buildPresenceTrendPoint(label: string, events: PresenceEvent[]): WeeklyPresenceTrendPoint {
  const presence = summarizeEventsPresence(events);

  return {
    label,
    presenceRate: presence.presenceRate,
    hasPresenceData: presence.hasPresenceData,
  };
}

function buildPastorWeeklyPresenceTrendPoints({
  currentWeekStart,
  previousEvents,
  currentEvents,
}: {
  currentWeekStart: Date;
  previousEvents: (PresenceEvent & { startsAt: Date })[];
  currentEvents: PresenceEvent[];
}): WeeklyPresenceTrendPoint[] {
  const previousPoints = PASTOR_PRESENCE_TREND_WEEK_LABELS.map((label, index) => {
    const weekStart = addBrasiliaDays(currentWeekStart, (index - PASTOR_PRESENCE_TREND_WEEK_LABELS.length) * 7);
    const weekEnd = addBrasiliaDays(weekStart, 7);
    const events = previousEvents.filter((event) => event.startsAt >= weekStart && event.startsAt < weekEnd);

    return buildPresenceTrendPoint(label, events);
  });

  return [
    ...previousPoints,
    buildPresenceTrendPoint("esta sem.", currentEvents),
  ];
}

function pastorTeamGroupInclude(presenceHistoryWhere: ReturnType<typeof presenceHistoryEventWhere>) {
  return {
    responsibilities: activeGroupResponsibilitiesInclude,
    memberships: {
      where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
      include: { person: { select: { status: true } } },
    },
    signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
    events: {
      where: presenceHistoryWhere,
      orderBy: { startsAt: "desc" as const },
      take: PRESENCE_TREND_RECENT_SAMPLE_COUNT,
      include: { attendances: true },
    },
  };
}

export async function getPastorDashboard(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorDashboard requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const weekStart = startOfBrasiliaWeek(now, 1);
  const weekEnd = endOfBrasiliaWeek(now, 1);
  const previousMonthStart = addBrasiliaDays(weekStart, -28);
  const tomorrow = addBrasiliaDays(startOfBrasiliaDay(now), 1);
  const presenceHistoryWhere = presenceHistoryEventWhere(now);
  const groupInclude = pastorTeamGroupInclude(presenceHistoryWhere);

  const [weeklyEvents, previousMonthEvents, activeGroups, supervisorsCount, groupsWithoutSupervisorCount, inactiveGroupsCount] = await Promise.all([
    prisma.event.findMany({
      where: {
        churchId,
        type: EventType.CELL_MEETING,
        startsAt: { gte: weekStart, lte: weekEnd },
        group: { is: { churchId, isActive: true } },
      },
      include: { attendances: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.event.findMany({
      where: {
        churchId,
        type: EventType.CELL_MEETING,
        startsAt: { gte: previousMonthStart, lt: weekStart },
        group: { is: { churchId, isActive: true } },
      },
      include: { attendances: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.smallGroup.findMany({
      where: { churchId, kind: GroupKind.CELL, isActive: true },
      include: groupInclude,
      orderBy: { name: "asc" },
    }),
    prisma.user.count({ where: { churchId, role: UserRole.SUPERVISOR } }),
    prisma.smallGroup.count({
      where: {
        churchId,
        kind: GroupKind.CELL,
        isActive: true,
        responsibilities: { none: activeGroupResponsibilityWhere(GroupResponsibilityRole.SUPERVISOR) },
      },
    }),
    prisma.smallGroup.count({ where: { churchId, kind: GroupKind.CELL, isActive: false } }),
  ]);

  const dueEvents = weeklyEvents.filter((event) => event.startsAt < tomorrow);
  const completedEvents = dueEvents.filter(isPresenceRecordedEvent);
  const previousCompletedEvents = previousMonthEvents.filter(isPresenceRecordedEvent);
  const presence = summarizeEventsPresence(completedEvents);
  const previousMonthPresence = summarizeEventsPresence(previousCompletedEvents);
  const groups = activeGroups.map(buildPastorTeamGroup);
  const groupsNeedingAttention = groups.filter((group) => group.pastoralPriorityScore > 0);

  return {
    weeklyPresence: {
      presenceRate: presence.presenceRate,
      hasPresenceData: presence.hasPresenceData,
      recordedEventsCount: presence.recordedEventsCount,
      monthTrend: buildWeeklyPresenceMonthTrend({ current: presence, previous: previousMonthPresence }),
      trendPoints: buildPastorWeeklyPresenceTrendPoints({
        currentWeekStart: weekStart,
        previousEvents: previousCompletedEvents,
        currentEvents: completedEvents,
      }),
    },
    healthOverview: buildPastoralHealthOverview(groups),
    teamSummary: {
      supervisorsCount,
      groupsCount: groups.length,
      pastoralCasesCount: sumBy(groups, (group) => group.pastoralCasesCount),
      urgentCount: sumBy(groups, (group) => group.urgentCount),
      supportRequestsCount: sumBy(groups, (group) => group.supportRequestsCount),
      groupsNeedingAttentionCount: groupsNeedingAttention.length,
      groupsWithoutSupervisorCount,
      inactiveGroupsCount,
    },
  };
}

export async function getPastorTeamOverview(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorTeamOverview requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const presenceHistoryWhere = presenceHistoryEventWhere(now);

  const groupInclude = pastorTeamGroupInclude(presenceHistoryWhere);

  const [supervisors, groupsWithoutSupervisor] = await Promise.all([
    prisma.user.findMany({
      where: { churchId, role: UserRole.SUPERVISOR },
      include: {
        groupResponsibilities: {
          where: {
            churchId,
            ...activeGroupResponsibilityWhere(GroupResponsibilityRole.SUPERVISOR),
            group: { is: { churchId, isActive: true } },
          },
          include: {
            group: {
              include: groupInclude,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.smallGroup.findMany({
      where: {
        churchId,
        isActive: true,
        responsibilities: { none: activeGroupResponsibilityWhere(GroupResponsibilityRole.SUPERVISOR) },
      },
      include: groupInclude,
      orderBy: { name: "asc" },
    }),
  ]);

  const toTeamGroup = buildPastorTeamGroup;

  const supervisorTeams = supervisors.map((supervisor) => buildSupervisorTeam({
    supervisor,
    groups: supervisor.groupResponsibilities.map((responsibility) => responsibility.group),
  })).sort(compareSupervisorPriority);
  const unassignedGroups = groupsWithoutSupervisor.map(toTeamGroup).sort(comparePastoralPriorityThenName);
  const allGroups = [...supervisorTeams.flatMap((supervisor) => supervisor.groups), ...unassignedGroups];
  const priorityGroups = allGroups.filter((group) => group.pastoralPriorityScore > 0);

  return {
    supervisors: supervisorTeams,
    unassignedGroups,
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
  const weekStart = startOfBrasiliaWeek(now, 1);
  const weekEnd = endOfBrasiliaWeek(now, 1);
  const tomorrow = addBrasiliaDays(startOfBrasiliaDay(now), 1);
  const presenceHistoryWhere = presenceHistoryEventWhere(now);

  const [groups, weeklyEvents] = await Promise.all([
    prisma.smallGroup.findMany({
      where: getVisibleGroupWhere(user),
      include: {
        responsibilities: activeGroupResponsibilitiesInclude,
        memberships: { where: { leftAt: null, role: { not: MembershipRole.VISITOR } }, include: { person: true } },
        signals: { where: { status: SignalStatus.OPEN }, include: { person: true, assignedTo: true } },
        events: {
          where: presenceHistoryWhere,
          orderBy: { startsAt: "desc" },
          take: PRESENCE_TREND_TOTAL_SAMPLE_COUNT,
          include: { attendances: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.event.findMany({
      where: {
        ...getVisibleEventWhere(user),
        type: EventType.CELL_MEETING,
        startsAt: { gte: weekStart, lte: weekEnd },
      },
      include: { attendances: true },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  const recordedWeeklyEvents = weeklyEvents
    .filter((event) => event.startsAt < tomorrow)
    .filter(isPresenceRecordedEvent);
  const weeklyPresence = summarizeEventsPresence(recordedWeeklyEvents);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const attentionPeople = getPastoralSectionSignalsByPerson(signals, user);
  const groupsWithPresence = groups.map((group) => buildScopedGroupDashboardItem(group, user, now));

  return {
    groups: groupsWithPresence,
    attentionPeople,
    weeklyPresence: {
      presenceRate: weeklyPresence.presenceRate,
      hasPresenceData: weeklyPresence.hasPresenceData,
      recordedEventsCount: weeklyPresence.recordedEventsCount,
    },
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
