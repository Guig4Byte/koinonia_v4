import {
  AttendanceStatus,
  EventStatus,
  GroupResponsibilityRole,
} from "../../../src/generated/prisma/client";
import { e2ePrisma } from "./db";
import { leaderCredentials } from "./credentials";
import { formatPresenceRate } from "./presence";

type CheckInAdjustmentTarget = {
  expectedPresenceRate: string;
  path: string;
};

let cachedAdjustmentTarget: CheckInAdjustmentTarget | null = null;

export async function findLeaderCheckInAdjustmentTarget() {
  if (cachedAdjustmentTarget) return cachedAdjustmentTarget;

  const leader = await e2ePrisma.user.findUnique({
    where: { email: leaderCredentials.email },
    select: { id: true },
  });

  if (!leader) {
    throw new Error(`Usuario ${leaderCredentials.email} nao encontrado. Rode npm run db:seed antes do e2e.`);
  }

  const event = await e2ePrisma.event.findFirst({
    where: {
      status: EventStatus.COMPLETED,
      startsAt: { lte: new Date() },
      group: {
        responsibilities: {
          some: {
            activeUntil: null,
            role: GroupResponsibilityRole.LEADER,
            userId: leader.id,
          },
        },
      },
      attendances: {
        some: {
          status: {
            in: [
              AttendanceStatus.PRESENT,
              AttendanceStatus.ABSENT,
              AttendanceStatus.JUSTIFIED,
            ],
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
    select: {
      attendances: {
        select: { status: true },
      },
      id: true,
    },
  });

  if (!event) {
    throw new Error("Nenhum encontro concluido da Celula Esperanca foi encontrado. Rode npm run db:seed antes do e2e.");
  }

  cachedAdjustmentTarget = {
    expectedPresenceRate: formatPresenceRate(event.attendances),
    path: `/eventos/${event.id}?modo=ajuste`,
  };
  return cachedAdjustmentTarget;
}
