import { EventStatus, MembershipRole, PersonStatus, SignalSource, SignalStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  countConsecutiveAbsences,
  describeAttendanceSignal,
  getRecordedStatusesNewestFirst,
  shouldKeepAttendanceSignalResolved,
} from "./rules-core";

const attentionStatuses = [PersonStatus.ACTIVE, PersonStatus.NEW, PersonStatus.NEEDS_ATTENTION, PersonStatus.COOLING_AWAY];

async function markPersonInAttention(personId: string) {
  await prisma.person.updateMany({
    where: { id: personId, status: { in: attentionStatuses } },
    data: { status: PersonStatus.NEEDS_ATTENTION },
  });
}

async function markPersonActiveIfNoOpenSignals(churchId: string, personId: string) {
  const openSignalsCount = await prisma.careSignal.count({
    where: { churchId, personId, status: SignalStatus.OPEN },
  });

  if (openSignalsCount > 0) return;

  await prisma.person.updateMany({
    where: { id: personId, status: PersonStatus.NEEDS_ATTENTION },
    data: { status: PersonStatus.ACTIVE },
  });
}

export type AttendanceSnapshot = {
  personId: string;
  fullName: string;
  statusesNewestFirst: ReturnType<typeof getRecordedStatusesNewestFirst>;
};

export async function recalculateAttendanceSignalsForGroup(groupId: string) {
  const group = await prisma.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
        include: { person: true },
      },
      events: {
        where: {
          type: "CELL_MEETING",
          startsAt: { lte: new Date() },
          OR: [{ status: EventStatus.COMPLETED }, { attendances: { some: {} } }],
        },
        orderBy: { startsAt: "desc" },
        take: 4,
        include: { attendances: true },
      },
    },
  });

  if (!group) return;

  for (const membership of group.memberships) {
    const statuses = getRecordedStatusesNewestFirst(group.events, membership.personId);
    const absences = countConsecutiveAbsences(statuses);
    const signal = describeAttendanceSignal(absences);
    const latestEvidenceAt = group.events.find((event) => event.attendances.some((item) => item.personId === membership.personId))?.startsAt ?? null;

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

      await markPersonActiveIfNoOpenSignals(group.churchId, membership.personId);
      continue;
    }

    if (existing) {
      await prisma.careSignal.update({
        where: { id: existing.id },
        data: {
          severity: signal.severity,
          reason: signal.reason,
          evidence: signal.evidence,
          lastEvidenceAt: latestEvidenceAt ?? new Date(),
        },
      });

      await markPersonInAttention(membership.personId);
    } else {
      const lastResolvedAttendanceSignal = await prisma.careSignal.findFirst({
        where: {
          churchId: group.churchId,
          groupId: group.id,
          personId: membership.personId,
          source: SignalSource.ATTENDANCE,
          status: SignalStatus.RESOLVED,
        },
        orderBy: { resolvedAt: "desc" },
        select: { reason: true, evidence: true, resolvedAt: true },
      });

      if (shouldKeepAttendanceSignalResolved(signal, latestEvidenceAt, lastResolvedAttendanceSignal)) {
        await markPersonActiveIfNoOpenSignals(group.churchId, membership.personId);
        continue;
      }

      await prisma.careSignal.create({
        data: {
          churchId: group.churchId,
          groupId: group.id,
          personId: membership.personId,
          assignedToId: null,
          source: SignalSource.ATTENDANCE,
          severity: signal.severity,
          reason: signal.reason,
          evidence: signal.evidence,
          lastEvidenceAt: latestEvidenceAt ?? new Date(),
        },
      });

      await markPersonInAttention(membership.personId);
    }
  }
}
