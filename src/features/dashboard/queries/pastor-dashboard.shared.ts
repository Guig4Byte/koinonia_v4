import { SignalStatus } from "@/generated/prisma/client";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { PRESENCE_TREND_RECENT_SAMPLE_COUNT } from "@/features/events/presence-summary";
import { activeGroupResponsibilitiesInclude, activeNonVisitorMembershipWhere } from "@/features/groups/group-query";

export function pastorTeamGroupInclude(presenceHistoryWhere: ReturnType<typeof presenceHistoryEventWhere>) {
  return {
    responsibilities: activeGroupResponsibilitiesInclude,
    memberships: {
      where: activeNonVisitorMembershipWhere,
      include: {
        person: {
          select: {
            id: true,
            fullName: true,
            birthDate: true,
            status: true,
          },
        },
      },
    },
    signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
    events: {
      where: presenceHistoryWhere,
      orderBy: { startsAt: "desc" as const },
      take: PRESENCE_TREND_RECENT_SAMPLE_COUNT,
      include: { attendances: true },
    },
  };
}
