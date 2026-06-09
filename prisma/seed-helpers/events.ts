import type {
  AttendanceStatus,
  EventStatus,
} from "../../src/generated/prisma/client";
import type { SeedPrismaClient } from "./types";

export async function createSeedEvent({
  prisma,
  churchId,
  groupId,
  createdById,
  title,
  startsAt,
  status,
  locationName,
  generatedFromSchedule = true,
  scheduleStartsAt,
}: {
  prisma: SeedPrismaClient;
  churchId: string;
  groupId?: string | null;
  createdById?: string | null;
  title: string;
  startsAt: Date;
  status: EventStatus;
  locationName?: string | null;
  generatedFromSchedule?: boolean;
  scheduleStartsAt?: Date | null;
}) {
  return prisma.event.create({
    data: {
      churchId,
      groupId,
      createdById,
      title,
      startsAt,
      status,
      locationName,
      generatedFromSchedule,
      scheduleStartsAt,
    },
  });
}

export async function createSeedAttendanceRecords({
  prisma,
  eventId,
  records,
}: {
  prisma: SeedPrismaClient;
  eventId: string;
  records: Array<{ personId: string; status: AttendanceStatus }>;
}) {
  if (records.length === 0) return;

  await prisma.attendance.createMany({
    data: records.map((record) => ({
      eventId,
      personId: record.personId,
      status: record.status,
    })),
  });
}
