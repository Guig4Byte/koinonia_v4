import { z } from "zod";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { canManageEventDetails, type PermissionUser } from "@/features/permissions/permissions";
import { EventStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { commandError, commandOk, type ApiCommandResult } from "@/lib/api-command-result";

export const eventDetailsPayloadSchema = z.object({
  locationName: z.string().trim().min(1).max(EVENT_LOCATION_MAX_LENGTH).optional(),
  startsAt: z.string().trim().min(1).optional(),
  status: z.union([
    z.literal(EventStatus.SCHEDULED),
    z.literal(EventStatus.CANCELLED),
    z.literal(EventStatus.NO_MEETING),
  ]).optional(),
}).refine((payload) => payload.locationName !== undefined || payload.startsAt !== undefined || payload.status !== undefined, {
  message: "Nenhuma alteração informada",
});

export type EventDetailsPayload = z.infer<typeof eventDetailsPayloadSchema>;

type EventDetailsCommandResult = ApiCommandResult<{
  event: {
    id: string;
    locationName: string | null;
    startsAt: Date;
    status: EventStatus;
    scheduleStartsAt: Date | null;
  };
}>;

export async function updateEventDetails(
  user: PermissionUser,
  eventId: string,
  body: EventDetailsPayload,
): Promise<EventDetailsCommandResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: { include: { responsibilities: activeGroupResponsibilitiesScopeInclude } },
      _count: { select: { attendances: true } },
    },
  });

  if (!event || event.churchId !== user.churchId) {
    return commandError("Encontro não encontrado", 404);
  }

  if (!event.groupId || !canManageEventDetails(user, event)) {
    return commandError("Você não pode alterar este encontro", 403);
  }

  let nextStartsAt = event.startsAt;

  if (body.startsAt !== undefined) {
    if (event._count.attendances > 0) {
      return commandError("Este encontro já tem presença registrada e não está disponível para remarcação", 400);
    }

    nextStartsAt = new Date(body.startsAt);
    if (Number.isNaN(nextStartsAt.getTime())) {
      return commandError("Data e horário do encontro inválidos", 400);
    }
  }

  const closesMeeting = body.status === EventStatus.CANCELLED || body.status === EventStatus.NO_MEETING;

  if (closesMeeting && event._count.attendances > 0) {
    return commandError("Este encontro já tem presença registrada e não está disponível para cancelamento", 400);
  }

  const now = new Date();

  if (body.status === EventStatus.CANCELLED && nextStartsAt <= now) {
    return commandError("Encontro já iniciado deve ser marcado como não realizado", 400);
  }

  if (body.status === EventStatus.NO_MEETING && nextStartsAt > now) {
    return commandError("Encontro futuro deve ser cancelado", 400);
  }

  const data: {
    locationName?: string | null;
    startsAt?: Date;
    status?: EventStatus;
    generatedFromSchedule?: boolean;
    scheduleStartsAt?: Date;
  } = {};

  if (body.locationName !== undefined) {
    data.locationName = body.locationName.trim();
  }

  if (body.startsAt !== undefined) {
    const duplicatedEvent = await prisma.event.findFirst({
      where: {
        id: { not: event.id },
        groupId: event.groupId,
        type: event.type,
        startsAt: nextStartsAt,
      },
      select: { id: true },
    });

    if (duplicatedEvent) {
      return commandError("Já existe um encontro desta célula neste dia e horário", 409);
    }

    data.startsAt = nextStartsAt;
    data.generatedFromSchedule = false;
    data.scheduleStartsAt = event.scheduleStartsAt ?? event.startsAt;
    data.status = EventStatus.SCHEDULED;
  }

  if (body.status !== undefined) {
    data.status = body.status;
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data,
    select: { id: true, locationName: true, startsAt: true, status: true, scheduleStartsAt: true },
  });

  return commandOk({ event: updated });
}
