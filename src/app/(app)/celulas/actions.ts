"use server";

import { redirect } from "next/navigation";
import { EventStatus, EventType, GroupKind } from "@/generated/prisma/client";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { canManageGroups } from "@/features/permissions/permissions";
import { parseGroupFormData, type GroupFormError, type GroupFormValues } from "@/features/groups/group-form";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { ROUTES, routeWithQuery } from "@/lib/routes";

function redirectWithError(path: string, error: GroupFormError | "permissao" | "nao-encontrada"): never {
  redirect(routeWithQuery(path, { erro: error }));
}

function groupData(values: GroupFormValues) {
  return {
    name: values.name,
    meetingDayOfWeek: values.meetingDayOfWeek,
    meetingTime: values.meetingTime,
    locationName: values.locationName,
    isActive: values.isActive,
  };
}

function hasScheduleOrLocationChange(
  current: { meetingDayOfWeek: number | null; meetingTime: string | null; locationName: string | null; isActive: boolean },
  next: GroupFormValues,
) {
  return current.meetingDayOfWeek !== next.meetingDayOfWeek
    || current.meetingTime !== next.meetingTime
    || current.locationName !== next.locationName
    || current.isActive !== next.isActive;
}

async function refreshFutureGeneratedMeetings(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
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

export async function createCellAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirectWithError(ROUTES.team, "permissao");
  }

  const parsed = parseGroupFormData(formData);
  if (!parsed.ok) {
    redirectWithError(ROUTES.newCell, parsed.error);
  }

  const group = await prisma.smallGroup.create({
    data: {
      churchId: user.churchId,
      kind: GroupKind.CELL,
      ...groupData(parsed.values),
    },
    select: {
      id: true,
      locationName: true,
      isActive: true,
      meetingDayOfWeek: true,
      meetingTime: true,
    },
  });

  await refreshFutureGeneratedMeetings(user, group);

  redirect(routeWithQuery(group.isActive ? ROUTES.group(group.id) : ROUTES.team, { salvo: "celula-criada" }));
}

export async function updateCellAction(groupId: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirectWithError(ROUTES.editGroup(groupId), "permissao");
  }

  const parsed = parseGroupFormData(formData);
  if (!parsed.ok) {
    redirectWithError(ROUTES.editGroup(groupId), parsed.error);
  }

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

  if (!current) {
    redirectWithError(ROUTES.team, "nao-encontrada");
  }

  const shouldRefreshMeetings = hasScheduleOrLocationChange(current, parsed.values);
  const shouldRenameFutureMeetings = current.name !== parsed.values.name;
  const group = await prisma.smallGroup.update({
    where: { id: current.id },
    data: groupData(parsed.values),
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

  redirect(routeWithQuery(group.isActive ? ROUTES.group(group.id) : ROUTES.team, { salvo: "celula-atualizada" }));
}
