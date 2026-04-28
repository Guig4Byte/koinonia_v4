import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AttendanceStatus } from "../../../../../generated/prisma/client";
import { recalculateAttendanceSignalsForGroup } from "@/features/signals/rules";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  attendances: z.array(
    z.object({
      personId: z.string().uuid(),
      status: z.nativeEnum(AttendanceStatus),
    }),
  ),
});

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const body = payloadSchema.parse(await request.json());

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: true },
  });

  if (!event || event.churchId !== user.churchId) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  const canMark =
    user.role === "PASTOR" ||
    user.role === "ADMIN" ||
    event.group?.leaderUserId === user.id ||
    event.group?.supervisorUserId === user.id;

  if (!canMark) {
    return NextResponse.json({ error: "Sem permissão para este check-in" }, { status: 403 });
  }

  if (event.groupId) {
    const memberships = await prisma.groupMembership.findMany({
      where: { groupId: event.groupId, leftAt: null },
      select: { personId: true },
    });
    const allowedPersonIds = new Set(memberships.map((membership) => membership.personId));
    const hasInvalidPerson = body.attendances.some((attendance) => !allowedPersonIds.has(attendance.personId));

    if (hasInvalidPerson) {
      return NextResponse.json({ error: "A presença contém pessoa fora desta célula" }, { status: 400 });
    }
  }

  await prisma.$transaction([
    ...body.attendances.map((attendance) =>
      prisma.attendance.upsert({
        where: { eventId_personId: { eventId, personId: attendance.personId } },
        create: { eventId, personId: attendance.personId, status: attendance.status },
        update: { status: attendance.status, markedAt: new Date() },
      }),
    ),
    prisma.event.update({ where: { id: eventId }, data: { status: "COMPLETED" } }),
  ]);

  if (event.groupId) {
    await recalculateAttendanceSignalsForGroup(event.groupId);
  }

  return NextResponse.json({ ok: true });
}
