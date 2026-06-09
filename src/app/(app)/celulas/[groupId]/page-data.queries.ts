import { EventType, PersonStatus, SignalStatus } from "@/generated/prisma/client";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { GROUP_DETAIL_EVENT_HISTORY_LIMIT } from "@/features/groups/group-detail-view";
import { activeGroupResponsibilitiesInclude, activeNonVisitorMembershipWhere } from "@/features/groups/group-query";
import { prisma } from "@/lib/prisma";

export async function getGroupDetailRecord(groupId: string) {
  return prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      responsibilities: activeGroupResponsibilitiesInclude,
      memberships: {
        where: activeNonVisitorMembershipWhere,
        include: { person: true },
        orderBy: { person: { fullName: "asc" } },
      },
      signals: {
        where: { status: SignalStatus.OPEN, person: { status: { not: PersonStatus.COOLING_AWAY } } },
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
}

export async function getGroupPresenceEvents({
  churchId,
  groupId,
  referenceDate,
}: {
  churchId: string;
  groupId: string;
  referenceDate: Date;
}) {
  return prisma.event.findMany({
    where: {
      churchId,
      groupId,
      ...presenceHistoryEventWhere(referenceDate),
    },
    include: { attendances: true },
    orderBy: { startsAt: "desc" },
    take: GROUP_DETAIL_EVENT_HISTORY_LIMIT,
  });
}

export type GroupDetailRecord = NonNullable<Awaited<ReturnType<typeof getGroupDetailRecord>>>;
export type GroupPresenceEvent = Awaited<ReturnType<typeof getGroupPresenceEvents>>[number];
