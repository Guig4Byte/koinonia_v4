import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateMemberCheckInPayload } from "@/features/check-in/check-in-validation";
import { AttendanceStatus } from "../../../../../generated/prisma/client";
import { canCheckInEvent } from "@/features/permissions/permissions";
import { recalculateAttendanceSignalsForGroup } from "@/features/signals/rules";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const memberAttendanceStatusSchema = z.union([
  z.literal(AttendanceStatus.PRESENT),
  z.literal(AttendanceStatus.ABSENT),
  z.literal(AttendanceStatus.JUSTIFIED),
]);

const payloadSchema = z.object({
  attendances: z.array(
    z.object({
      personId: z.string().uuid(),
      status: memberAttendanceStatusSchema,
    }),
  ),
  visitors: z.array(
    z.object({
      fullName: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(30).optional(),
    }),
  ).default([]),
});

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const json = await request.json().catch(() => null);
  const parsedBody = payloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Dados de presença inválidos" }, { status: 400 });
  }

  const body = parsedBody.data;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true },
  });

  if (!event || event.churchId !== user.churchId) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  if (!canCheckInEvent(user, event)) {
    return NextResponse.json({ error: "Somente o líder da célula pode registrar este check-in" }, { status: 403 });
  }

  if (!event.groupId) {
    return NextResponse.json({ error: "Este evento não está vinculado a uma célula" }, { status: 400 });
  }

  const groupId = event.groupId;

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId, leftAt: null, role: { not: "VISITOR" } },
    select: { personId: true },
  });

  const validation = validateMemberCheckInPayload(
    memberships.map((membership) => membership.personId),
    body.attendances,
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const attendance of body.attendances) {
      await tx.attendance.upsert({
        where: { eventId_personId: { eventId, personId: attendance.personId } },
        create: { eventId, personId: attendance.personId, status: attendance.status },
        update: { status: attendance.status, markedAt: new Date() },
      });
    }

    for (const visitor of body.visitors) {
      const person = await tx.person.create({
        data: {
          churchId: user.churchId,
          fullName: visitor.fullName,
          phone: visitor.phone,
          status: "VISITOR",
          shortNote: "Visitante registrado no check-in.",
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId,
          personId: person.id,
          role: "VISITOR",
        },
      });

      await tx.attendance.create({
        data: {
          eventId,
          personId: person.id,
          status: AttendanceStatus.VISITOR,
        },
      });
    }

    await tx.event.update({ where: { id: eventId }, data: { status: "COMPLETED" } });
  });

  await recalculateAttendanceSignalsForGroup(groupId);

  return NextResponse.json({ ok: true });
}
