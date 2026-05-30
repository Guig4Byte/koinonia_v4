import { z } from "zod";
import { validateMemberCheckInPayload } from "@/features/check-in/check-in-validation";
import { validateNewVisitors } from "@/features/check-in/visitor-validation";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { canCheckInEvent, type PermissionUser } from "@/features/permissions/permissions";
import { recalculateAttendanceSignalsForGroup } from "@/features/signals/rules";
import { AttendanceStatus, EventStatus, MembershipRole, PersonStatus, SignalStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { commandError, commandOk, type ApiCommandResult } from "@/lib/api-command-result";

const memberAttendanceStatusSchema = z.union([
  z.literal(AttendanceStatus.PRESENT),
  z.literal(AttendanceStatus.ABSENT),
  z.literal(AttendanceStatus.JUSTIFIED),
]);

export const eventCheckInPayloadSchema = z.object({
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

export type EventCheckInPayload = z.infer<typeof eventCheckInPayloadSchema>;

type EventCheckInCommandResult = ApiCommandResult<{
  openSignalPeopleCount: number;
}>;

async function findExistingVisitorAttendances(eventId: string, hasNewVisitors: boolean) {
  if (!hasNewVisitors) return [];

  return prisma.attendance.findMany({
    where: { eventId, status: AttendanceStatus.VISITOR },
    include: { person: true },
  });
}

async function countOpenSignalPeople(churchId: string, groupId: string) {
  const openSignalPeople = await prisma.careSignal.findMany({
    where: { churchId, groupId, status: SignalStatus.OPEN },
    distinct: ["personId"],
    select: { personId: true },
  });

  return openSignalPeople.length;
}

export async function registerEventCheckIn(
  user: PermissionUser,
  eventId: string,
  body: EventCheckInPayload,
): Promise<EventCheckInCommandResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { group: { include: { responsibilities: activeGroupResponsibilitiesScopeInclude } } },
  });

  if (!event || event.churchId !== user.churchId) {
    return commandError("Evento não encontrado", 404);
  }

  if (!canCheckInEvent(user, event)) {
    return commandError("A presença deste encontro fica disponível para a liderança da célula", 403);
  }

  if (!event.groupId) {
    return commandError("Este evento não está vinculado a uma célula", 400);
  }

  const groupId = event.groupId;
  const existingVisitors = await findExistingVisitorAttendances(eventId, body.visitors.length > 0);
  const visitorValidation = validateNewVisitors(
    existingVisitors.map((attendance) => ({ fullName: attendance.person.fullName })),
    body.visitors,
  );

  if (!visitorValidation.ok) {
    return commandError(visitorValidation.error, 400);
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId, leftAt: null, role: { not: MembershipRole.VISITOR } },
    select: { personId: true },
  });

  const validation = validateMemberCheckInPayload(
    memberships.map((membership) => membership.personId),
    body.attendances,
  );

  if (!validation.ok) {
    return commandError(validation.error, 400);
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
          status: PersonStatus.VISITOR,
          shortNote: "Visitante registrado no check-in.",
        },
      });

      await tx.groupMembership.create({
        data: {
          groupId,
          personId: person.id,
          role: MembershipRole.VISITOR,
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

    await tx.event.update({ where: { id: eventId }, data: { status: EventStatus.COMPLETED } });
    await recalculateAttendanceSignalsForGroup(groupId, tx);
  });

  const openSignalPeopleCount = await countOpenSignalPeople(user.churchId, groupId);

  return commandOk({ openSignalPeopleCount });
}
