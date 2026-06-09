import { EventType, GroupKind, GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { buildPastoralHealthOverview } from "@/features/dashboard/pastoral-health";
import { buildWeeklyPresenceMonthTrend, type WeeklyPresenceTrendPoint } from "@/features/dashboard/presence-health";
import {
  buildPastorTeamGroup,
  sumBy,
} from "@/features/dashboard/dashboard-view";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { isPresenceRecordedEvent, summarizeEventsPresence, type PresenceEvent } from "@/features/events/presence-summary";
import { activeGroupResponsibilityWhere } from "@/features/groups/group-query";
import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import { canUsePastorDashboard, type PermissionUser } from "@/features/permissions/permissions";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";
import { pastorTeamGroupInclude } from "@/features/dashboard/queries/pastor-dashboard.shared";

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
    prisma.user.count({ where: { churchId, role: UserRole.SUPERVISOR, isActive: true } }),
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
  const groupsNeedingAttention = groups.filter((group) => groupPastoralState(group).needsTeamAttention);
  const hasRecordedCellMeetings = groups.some((group) => group.recordedEventsCount > 0);

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
      hasRecordedCellMeetings,
    },
  };
}
