import {
  AttendanceStatus,
  EventStatus,
  GroupResponsibilityRole,
} from "../../../src/generated/prisma/client";
import { e2ePrisma } from "./db";
import { leaderCredentials } from "./credentials";
import { formatPresenceRate } from "./presence";

type EventCardTarget = {
  expectedPresenceRate: string;
  path: string;
  title: string;
};

let cachedEventCardTarget: EventCardTarget | null = null;

export async function findLeaderEventCardTarget() {
  if (cachedEventCardTarget) return cachedEventCardTarget;

  const leader = await e2ePrisma.user.findUnique({
    where: { email: leaderCredentials.email },
    select: { id: true },
  });

  if (!leader) {
    throw new Error(`Usuario ${leaderCredentials.email} nao encontrado. Rode npm run db:seed antes do e2e.`);
  }

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 30);

  const event = await e2ePrisma.event.findFirst({
    where: {
      status: EventStatus.COMPLETED,
      startsAt: {
        gte: periodStart,
        lte: new Date(),
      },
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
      title: true,
    },
  });

  if (!event) {
    throw new Error("Nenhum encontro com presenca registrada foi encontrado nos ultimos 30 dias. Rode npm run db:seed antes do e2e.");
  }

  cachedEventCardTarget = {
    expectedPresenceRate: formatPresenceRate(event.attendances),
    path: "/eventos?consulta=historico&periodo=30d",
    title: event.title,
  };
  return cachedEventCardTarget;
}
