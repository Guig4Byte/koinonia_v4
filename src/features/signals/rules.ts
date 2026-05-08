import { EventStatus, MembershipRole, PersonStatus, SignalSource, SignalStatus } from "../../generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  countConsecutiveAbsences,
  describeAttendanceEvidence,
  describeAttendanceSignal,
  getConsecutiveAbsenceDatesNewestFirst,
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
    const absenceDates = getConsecutiveAbsenceDatesNewestFirst(group.events, membership.personId);
    const signal = describeAttendanceSignal(absences, describeAttendanceEvidence(absenceDates));
    const latestEvidenceAt = absenceDates[0]
      ?? group.events.find((event) => event.attendances.some((item) => item.personId === membership.personId))?.startsAt
      ?? null;

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
        await markPersonInAttention(membership.personId);
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
