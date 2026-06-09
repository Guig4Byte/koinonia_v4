import { PersonStatus, SignalSeverity, SignalSource, SignalStatus } from "@/generated/prisma/client";
import { presenceHistoryEventWhere } from "@/features/events/presence-query";
import { ATTENTION_ELIGIBLE_PERSON_STATUSES, isInCareStatus } from "@/features/people/person-status";
import { activeNonVisitorMembershipWhere } from "@/features/groups/group-query";
import { prisma } from "@/lib/prisma";
import {
  countConsecutiveAbsences,
  describeAttendanceEvidence,
  describeAttendanceSignal,
  getConsecutiveAbsenceDatesNewestFirst,
  getRecordedStatusesNewestFirst,
  planAttendanceSignalSync,
  ATTENDANCE_SIGNAL_EVENT_LOOKBACK_COUNT,
} from "./rules-core";


type AttendanceSignalDatabase = Pick<typeof prisma, "smallGroup" | "careSignal" | "person">;

type OpenAttendanceSignal = { id: string; personId: string };
type ResolvedAttendanceSignal = {
  personId: string;
  severity: SignalSeverity;
  reason: string;
  evidence: string | null;
  resolvedAt: Date | null;
};

async function markPersonInAttention(db: AttendanceSignalDatabase, personId: string) {
  await db.person.updateMany({
    where: { id: personId, status: { in: ATTENTION_ELIGIBLE_PERSON_STATUSES } },
    data: { status: PersonStatus.NEEDS_ATTENTION },
  });
}

function mapFirstOpenSignalByPerson(signals: OpenAttendanceSignal[]) {
  const signalsByPerson = new Map<string, { id: string }>();

  for (const signal of signals) {
    if (!signalsByPerson.has(signal.personId)) {
      signalsByPerson.set(signal.personId, { id: signal.id });
    }
  }

  return signalsByPerson;
}

function mapLatestResolvedSignalByPerson(signalsNewestFirst: ResolvedAttendanceSignal[]) {
  const signalsByPerson = new Map<string, Omit<ResolvedAttendanceSignal, "personId">>();

  for (const signal of signalsNewestFirst) {
    if (!signalsByPerson.has(signal.personId)) {
      signalsByPerson.set(signal.personId, {
        severity: signal.severity,
        reason: signal.reason,
        evidence: signal.evidence,
        resolvedAt: signal.resolvedAt,
      });
    }
  }

  return signalsByPerson;
}

export async function recalculateAttendanceSignalsForGroup(groupId: string, db: AttendanceSignalDatabase = prisma) {
  const now = new Date();
  const group = await db.smallGroup.findUnique({
    where: { id: groupId },
    select: {
      id: true,
      churchId: true,
      memberships: {
        where: activeNonVisitorMembershipWhere,
        select: { personId: true, person: { select: { status: true } } },
      },
      events: {
        where: presenceHistoryEventWhere(now),
        orderBy: { startsAt: "desc" },
        take: ATTENDANCE_SIGNAL_EVENT_LOOKBACK_COUNT,
        select: {
          startsAt: true,
          attendances: {
            select: { personId: true, status: true },
          },
        },
      },
    },
  });

  if (!group || group.memberships.length === 0) return;

  const signalEligibleMemberships = group.memberships.filter((membership) => !isInCareStatus(membership.person.status));
  if (signalEligibleMemberships.length === 0) return;

  const personIds = signalEligibleMemberships.map((membership) => membership.personId);
  const existingOpenSignals = await db.careSignal.findMany({
    where: {
      churchId: group.churchId,
      groupId: group.id,
      personId: { in: personIds },
      source: SignalSource.ATTENDANCE,
      status: SignalStatus.OPEN,
    },
    select: { id: true, personId: true },
  });
  const openSignalsByPerson = mapFirstOpenSignalByPerson(existingOpenSignals);

  const plannedInputs = signalEligibleMemberships.map((membership) => {
    const statuses = getRecordedStatusesNewestFirst(group.events, membership.personId);
    const absences = countConsecutiveAbsences(statuses);
    const absenceDates = getConsecutiveAbsenceDatesNewestFirst(group.events, membership.personId);
    const signal = describeAttendanceSignal(absences, describeAttendanceEvidence(absenceDates));
    const latestEvidenceAt = absenceDates[0]
      ?? group.events.find((event) => event.attendances.some((item) => item.personId === membership.personId))?.startsAt
      ?? null;

    return {
      membership,
      signal,
      latestEvidenceAt,
      existingOpenSignal: openSignalsByPerson.get(membership.personId) ?? null,
    };
  });

  const resolvedSignalCandidatePersonIds = plannedInputs
    .filter((input) => input.signal && !input.existingOpenSignal)
    .map((input) => input.membership.personId);

  const resolvedSignals = resolvedSignalCandidatePersonIds.length > 0
    ? await db.careSignal.findMany({
        where: {
          churchId: group.churchId,
          groupId: group.id,
          personId: { in: resolvedSignalCandidatePersonIds },
          source: SignalSource.ATTENDANCE,
          status: SignalStatus.RESOLVED,
        },
        orderBy: { resolvedAt: "desc" },
        select: { personId: true, severity: true, reason: true, evidence: true, resolvedAt: true },
      })
    : [];
  const resolvedSignalsByPerson = mapLatestResolvedSignalByPerson(resolvedSignals);

  for (const input of plannedInputs) {
    const personId = input.membership.personId;
    const existingOpenSignal = input.existingOpenSignal;
    const plan = planAttendanceSignalSync({
      signal: input.signal,
      latestEvidenceAt: input.latestEvidenceAt,
      existingOpenSignal,
      lastResolvedAttendanceSignal: resolvedSignalsByPerson.get(personId) ?? null,
      fallbackDate: now,
    });

    if (plan.action === "none") continue;

    if (plan.action === "keep-open-signal") {
      await markPersonInAttention(db, personId);
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

      await markPersonInAttention(db, personId);
      continue;
    }

    await db.careSignal.create({
      data: {
        churchId: group.churchId,
        groupId: group.id,
        personId,
        assignedToId: null,
        source: SignalSource.ATTENDANCE,
        severity: plan.signal.severity,
        reason: plan.signal.reason,
        evidence: plan.signal.evidence,
        lastEvidenceAt: plan.lastEvidenceAt,
      },
    });

    await markPersonInAttention(db, personId);
  }
}
