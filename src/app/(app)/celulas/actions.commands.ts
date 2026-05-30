import { EventStatus, EventType, GroupKind } from "@/generated/prisma/client";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import type { GroupFormValues } from "@/features/groups/group-form";
import type { PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";

type CellSchedule = {
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
  locationName: string | null;
  isActive: boolean;
};

type PersistedCell = CellSchedule & {
  id: string;
  name: string;
};

function groupData(values: GroupFormValues) {
  return {
    name: values.name,
    meetingDayOfWeek: values.meetingDayOfWeek,
    meetingTime: values.meetingTime,
    locationName: values.locationName,
    isActive: values.isActive,
  };
}

function hasScheduleOrLocationChange(current: CellSchedule, next: GroupFormValues) {
  return current.meetingDayOfWeek !== next.meetingDayOfWeek
    || current.meetingTime !== next.meetingTime
    || current.locationName !== next.locationName
    || current.isActive !== next.isActive;
}

async function refreshFutureGeneratedMeetings(
  user: PermissionUser,
  group: { id: string; locationName: string | null; isActive: boolean; meetingDayOfWeek: number | null; meetingTime: string | null },
) {
  const now = new Date();

  await prisma.event.deleteMany({
    where: {
      groupId: group.id,
      type: EventType.CELL_MEETING,
      status: EventStatus.SCHEDULED,
      generatedFromSchedule: true,
      startsAt: { gte: now },
      attendances: { none: {} },
      locationName: group.locationName,
    },
  });

  if (group.isActive && group.meetingDayOfWeek !== null && group.meetingTime !== null) {
    await ensureUpcomingCellMeetingsForUser(user, { groupIds: [group.id], referenceDate: now });
  }
}

async function renameFutureGeneratedMeetings(group: Pick<PersistedCell, "id" | "name">) {
  await prisma.event.updateMany({
    where: {
      groupId: group.id,
      type: EventType.CELL_MEETING,
      status: EventStatus.SCHEDULED,
      generatedFromSchedule: true,
      startsAt: { gte: new Date() },
      attendances: { none: {} },
    },
    data: { title: group.name },
  });
}

export async function createCellForUser(user: PermissionUser, values: GroupFormValues) {
  const group = await prisma.smallGroup.create({
    data: {
      churchId: user.churchId,
      kind: GroupKind.CELL,
      ...groupData(values),
    },
    select: {
      id: true,
      name: true,
      locationName: true,
      isActive: true,
      meetingDayOfWeek: true,
      meetingTime: true,
    },
  });

  await refreshFutureGeneratedMeetings(user, group);

  return group;
}

export async function updateCellForUser(user: PermissionUser, groupId: string, values: GroupFormValues) {
  const current = await prisma.smallGroup.findFirst({
    where: {
      id: groupId,
      churchId: user.churchId,
      kind: GroupKind.CELL,
    },
    select: {
      id: true,
      name: true,
      meetingDayOfWeek: true,
      meetingTime: true,
      locationName: true,
      isActive: true,
    },
  });

  if (!current) return null;

  const shouldRefreshMeetings = hasScheduleOrLocationChange(current, values);
  const shouldRenameFutureMeetings = current.name !== values.name;
  const group = await prisma.smallGroup.update({
    where: { id: current.id },
    data: groupData(values),
    select: {
      id: true,
      name: true,
      locationName: true,
      isActive: true,
      meetingDayOfWeek: true,
      meetingTime: true,
    },
  });

  if (shouldRefreshMeetings) {
    await refreshFutureGeneratedMeetings(user, {
      ...group,
      locationName: current.locationName,
    });
  }

  if (shouldRenameFutureMeetings) {
    await renameFutureGeneratedMeetings(group);
  }

  return group;
}
