import { NextRequest } from "next/server";
import { z } from "zod";
import { EVENT_LOCATION_MAX_LENGTH } from "@/features/events/event-fields";
import { EventStatus } from "@/generated/prisma/client";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { canManageEventDetails } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const json = await readJsonBody(request);
  const parsedBody = payloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return apiError("Dados do encontro inválidos", 400);
  }

  const body = parsedBody.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: { include: { responsibilities: activeGroupResponsibilitiesScopeInclude } },
      _count: { select: { attendances: true } },
    },
  });

  if (!event || event.churchId !== user.churchId) {
    return apiError("Encontro não encontrado", 404);
  }

  if (!event.groupId || !canManageEventDetails(user, event)) {
    return apiError("Você não pode alterar este encontro", 403);
  }

  let nextStartsAt = event.startsAt;

  if (body.startsAt !== undefined) {
    if (event._count.attendances > 0) {
      return apiError("Este encontro já tem presença registrada e não está disponível para remarcação", 400);
    }

    nextStartsAt = new Date(body.startsAt);
    if (Number.isNaN(nextStartsAt.getTime())) {
      return apiError("Data e horário do encontro inválidos", 400);
    }
  }

  const closesMeeting = body.status === EventStatus.CANCELLED || body.status === EventStatus.NO_MEETING;

  if (closesMeeting && event._count.attendances > 0) {
    return apiError("Este encontro já tem presença registrada e não está disponível para cancelamento", 400);
  }

  const now = new Date();

  if (body.status === EventStatus.CANCELLED && nextStartsAt <= now) {
    return apiError("Encontro já iniciado deve ser marcado como não realizado", 400);
  }

  if (body.status === EventStatus.NO_MEETING && nextStartsAt > now) {
    return apiError("Encontro futuro deve ser cancelado", 400);
  }

  const data: { locationName?: string | null; startsAt?: Date; status?: EventStatus; generatedFromSchedule?: boolean; scheduleStartsAt?: Date } = {};

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
      return apiError("Já existe um encontro desta célula neste dia e horário", 409);
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

  return apiOk({ event: updated });
}
