import { EventStatus, EventType, type Prisma } from "@/generated/prisma/client";

export function presenceHistoryEventWhere(now: Date): Prisma.EventWhereInput {
  return {
    type: EventType.CELL_MEETING,
    startsAt: { lte: now },
    OR: [
      { status: EventStatus.COMPLETED },
      { attendances: { some: {} } },
    ],
  };
}
