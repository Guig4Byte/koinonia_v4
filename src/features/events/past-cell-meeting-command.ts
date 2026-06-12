import { z } from "zod";
import { parseBrasiliaDateTime } from "@/features/events/brasilia-date-time";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { canViewGroup, isGroupLeader, type PermissionUser } from "@/features/permissions/permissions";
import { EventStatus, EventType, GroupKind, UserRole } from "@/generated/prisma/client";
import { commandError, commandOk, type ApiCommandResult } from "@/lib/api-command-result";
import { prisma } from "@/lib/prisma";

const DUPLICATED_PAST_MEETING_MESSAGE =
  "Já existe um encontro desta célula nesse dia e horário. Revise o encontro existente antes de criar outro.";

export const pastCellMeetingPayloadSchema = z.object({
  groupId: z.string().trim().uuid(),
  date: z.string().trim().min(1),
  time: z.string().trim().min(1),
  locationName: z.string().trim().max(EVENT_LOCATION_MAX_LENGTH).optional(),
});

export type PastCellMeetingPayload = z.infer<typeof pastCellMeetingPayloadSchema>;

type CreatePastCellMeetingOptions = {
  referenceDate?: Date;
};

type PastCellMeetingCommandResult = ApiCommandResult<{
  event: {
    id: string;
  };
}>;

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function createPastCellMeeting(
  user: PermissionUser,
  body: PastCellMeetingPayload,
  options: CreatePastCellMeetingOptions = {},
): Promise<PastCellMeetingCommandResult> {
  const startsAtIso = parseBrasiliaDateTime(body.date, body.time);

  if (!startsAtIso) {
    return commandError("Informe uma data e horário válidos no horário de Brasília.", 400);
  }

  const startsAt = new Date(startsAtIso);
  const referenceDate = options.referenceDate ?? new Date();

  if (startsAt.getTime() > referenceDate.getTime()) {
    return commandError("Use uma data e horário que já passaram para registrar encontro anterior.", 400);
  }

  const group = await prisma.smallGroup.findFirst({
    where: {
      id: body.groupId,
      churchId: user.churchId,
      kind: GroupKind.CELL,
      isActive: true,
    },
    include: { responsibilities: activeGroupResponsibilitiesScopeInclude },
  });

  if (!group) {
    return commandError("Célula não encontrada", 404);
  }

  if (user.role !== UserRole.LEADER || !canViewGroup(user, group) || !isGroupLeader(user, group)) {
    return commandError("Somente a liderança da célula pode registrar encontro anterior.", 403);
  }

  const duplicatedEvent = await prisma.event.findFirst({
    where: {
      groupId: group.id,
      type: EventType.CELL_MEETING,
      OR: [
        { startsAt },
        { scheduleStartsAt: startsAt },
      ],
    },
    select: { id: true },
  });

  if (duplicatedEvent) {
    return commandError(DUPLICATED_PAST_MEETING_MESSAGE, 409);
  }

  const locationName = body.locationName?.trim() || group.locationName?.trim() || null;

  try {
    const event = await prisma.event.create({
      data: {
        churchId: user.churchId,
        groupId: group.id,
        createdById: user.id,
        type: EventType.CELL_MEETING,
        title: group.name,
        startsAt,
        status: EventStatus.SCHEDULED,
        locationName,
        generatedFromSchedule: false,
        scheduleStartsAt: startsAt,
      },
      select: { id: true },
    });

    return commandOk({ event });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return commandError(DUPLICATED_PAST_MEETING_MESSAGE, 409);
    }

    throw error;
  }
}
