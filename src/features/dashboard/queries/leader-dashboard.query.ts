import { EventType } from "@/generated/prisma/client";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import {
  LEADER_RELEVANT_EVENT_LIMIT,
  LEADER_RELEVANT_EVENT_LOOKBACK_DAYS,
  type LeaderDashboard,
  type LeaderPageSignal,
} from "@/features/dashboard/leader-dashboard-types";
import type { PermissionUser } from "@/features/permissions/permissions";
import { addBrasiliaDays, startOfBrasiliaDay } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";
import { getGroupScopedDashboard } from "@/features/dashboard/queries/group-scoped-dashboard.query";

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
  const hasRecordedMeetings = groupScoped.groups.some((group) => (group.recordedEventsCount ?? 0) > 0);
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
    primaryGroupId: groupIds[0] ?? null,
    attentionPeople,
    inCarePeople,
    currentEvent,
    hasRecordedMeetings,
  };
}
