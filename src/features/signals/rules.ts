import { EventStatus, EventType, MembershipRole, PersonStatus, SignalSource, SignalStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  countConsecutiveAbsences,
  describeAttendanceEvidence,
  describeAttendanceSignal,
  getConsecutiveAbsenceDatesNewestFirst,
  getRecordedStatusesNewestFirst,
  planAttendanceSignalSync,
} from "./rules-core";

const attentionStatuses = [PersonStatus.ACTIVE, PersonStatus.NEW, PersonStatus.NEEDS_ATTENTION, PersonStatus.COOLING_AWAY];

type AttendanceSignalDatabase = Pick<typeof prisma, "smallGroup" | "careSignal" | "person">;

async function markPersonInAttention(db: AttendanceSignalDatabase, personId: string) {
  await db.person.updateMany({
    where: { id: personId, status: { in: attentionStatuses } },
    data: { status: PersonStatus.NEEDS_ATTENTION },
  });
}

export async function recalculateAttendanceSignalsForGroup(groupId: string, db: AttendanceSignalDatabase = prisma) {
  const now = new Date();
  const group = await db.smallGroup.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        where: { leftAt: null, role: { not: MembershipRole.VISITOR } },
        include: { person: true },
      },
      events: {
        where: {
          type: EventType.CELL_MEETING,
          startsAt: { lte: now },
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

    const existingOpenSignal = await db.careSignal.findFirst({
      where: {
        churchId: group.churchId,
        groupId: group.id,
        personId: membership.personId,
        source: SignalSource.ATTENDANCE,
        status: SignalStatus.OPEN,
      },
      select: { id: true },
    });

    const lastResolvedAttendanceSignal = signal && !existingOpenSignal
      ? await db.careSignal.findFirst({
          where: {
            churchId: group.churchId,
            groupId: group.id,
            personId: membership.personId,
            source: SignalSource.ATTENDANCE,
            status: SignalStatus.RESOLVED,
          },
          orderBy: { resolvedAt: "desc" },
          select: { severity: true, reason: true, evidence: true, resolvedAt: true },
        })
      : null;

    const plan = planAttendanceSignalSync({
      signal,
      latestEvidenceAt,
      existingOpenSignal,
      lastResolvedAttendanceSignal,
      fallbackDate: now,
    });

    if (plan.action === "none") continue;

    if (plan.action === "keep-open-signal") {
      await markPersonInAttention(db, membership.personId);
      continue;
    }

    if (plan.action === "update-open-signal") {
      if (!existingOpenSignal) continue;

      await db.careSignal.update({
        where: { id: existingOpenSignal.id },
        data: {
          severity: plan.signal.severity,
          reason: plan.signal.reason,
          evidence: plan.signal.evidence,
          lastEvidenceAt: plan.lastEvidenceAt,
        },
      });

      await markPersonInAttention(db, membership.personId);
      continue;
    }

    await db.careSignal.create({
      data: {
        churchId: group.churchId,
        groupId: group.id,
        personId: membership.personId,
        assignedToId: null,
        source: SignalSource.ATTENDANCE,
        severity: plan.signal.severity,
        reason: plan.signal.reason,
        evidence: plan.signal.evidence,
        lastEvidenceAt: plan.lastEvidenceAt,
      },
    });

    await markPersonInAttention(db, membership.personId);
  }
}
