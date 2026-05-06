import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EventStatus } from "../../../../generated/prisma/client";
import { canManageEventDetails } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  locationName: z.string().trim().min(1).max(160).optional(),
  status: z.union([z.literal(EventStatus.SCHEDULED), z.literal(EventStatus.CANCELLED)]).optional(),
}).refine((payload) => payload.locationName !== undefined || payload.status !== undefined, {
  message: "Nenhuma alteração informada",
});

export async function PATCH(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const json = await readJsonBody(request);
  const parsedBody = payloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Dados do encontro inválidos" }, { status: 400 });
  }

  const body = parsedBody.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      group: { include: { responsibilities: { where: { activeUntil: null } } } },
      _count: { select: { attendances: true } },
    },
  });

  if (!event || event.churchId !== user.churchId) {
    return NextResponse.json({ error: "Encontro não encontrado" }, { status: 404 });
  }

  if (!event.groupId || !canManageEventDetails(user, event)) {
    return NextResponse.json({ error: "Você não pode alterar este encontro" }, { status: 403 });
  }

  if (body.status === EventStatus.CANCELLED && event._count.attendances > 0) {
    return NextResponse.json({ error: "Este encontro já tem presença registrada e não pode ser marcado como não realizado" }, { status: 400 });
  }

  const data: { locationName?: string | null; status?: EventStatus } = {};

  if (body.locationName !== undefined) {
    data.locationName = body.locationName.trim();
  }

  if (body.status !== undefined) {
    data.status = body.status;
  }

  const updated = await prisma.event.update({
    where: { id: event.id },
    data,
    select: { id: true, locationName: true, status: true },
  });

  return NextResponse.json({ ok: true, event: updated });
}
