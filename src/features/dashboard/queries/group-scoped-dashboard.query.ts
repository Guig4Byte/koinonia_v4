import { EventType, SignalStatus } from "@/generated/prisma/client";
import { buildScopedGroupDashboardItem } from "@/features/dashboard/dashboard-view";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { isPresenceRecordedEvent, PRESENCE_TREND_TOTAL_SAMPLE_COUNT, summarizeEventsPresence } from "@/features/events/presence-summary";
import { activeGroupResponsibilitiesInclude, activeNonVisitorMembershipWhere } from "@/features/groups/group-query";
import { getVisibleEventWhere, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSectionSignalsByPerson } from "@/features/signals/sections";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay, startOfBrasiliaWeek } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";

export async function getGroupScopedDashboard(user: PermissionUser) {
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
        memberships: { where: activeNonVisitorMembershipWhere, include: { person: true } },
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
