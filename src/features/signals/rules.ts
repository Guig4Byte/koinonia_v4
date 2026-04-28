import { AttendanceStatus, SignalSource, SignalStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { countConsecutiveAbsences, describeAttendanceSignal } from "./rules-core";

export type AttendanceSnapshot = {
  personId: string;
  fullName: string;
  statusesNewestFirst: AttendanceStatus[];
};

export async function recalculateAttendanceSignalsForGroup(groupId: string) {
  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { person: true },
      },
      events: {
        where: { type: "CELL_MEETING" },
        orderBy: { startsAt: "desc" },
        take: 4,
        include: { attendances: true },
      },
    },
  });

  if (!group) return;

  for (const membership of group.memberships) {
    const statuses = group.events.map((event) => {
      const attendance = event.attendances.find((item) => item.personId === membership.personId);
      return attendance?.status ?? AttendanceStatus.ABSENT;
    });

    const absences = countConsecutiveAbsences(statuses);
    const signal = describeAttendanceSignal(absences);

    const existing = await prisma.careSignal.findFirst({
      where: {
        churchId: group.churchId,
        groupId: group.id,
        personId: membership.personId,
        source: SignalSource.ATTENDANCE,
        status: SignalStatus.OPEN,
      },
    });

    if (!signal) {
      if (existing) {
        await prisma.careSignal.update({
          where: { id: existing.id },
          data: { status: SignalStatus.RESOLVED, resolvedAt: new Date() },
        });
      }
      continue;
    }

    if (existing) {
      await prisma.careSignal.update({
        where: { id: existing.id },
        data: {
          severity: signal.severity,
          reason: signal.reason,
          evidence: signal.evidence,
          lastEvidenceAt: new Date(),
        },
      });
    } else {
      await prisma.careSignal.create({
        data: {
          churchId: group.churchId,
          groupId: group.id,
          personId: membership.personId,
          assignedToId: group.leaderUserId,
          source: SignalSource.ATTENDANCE,
          severity: signal.severity,
          reason: signal.reason,
          evidence: signal.evidence,
        },
      });
    }
  }
}
