import { AttendanceStatus, SignalSeverity } from "@/generated/prisma/client";
import { formatBrasiliaShortDate } from "@/lib/brasilia-time";

export const ATTENDANCE_SIGNAL_EVENT_LOOKBACK_COUNT = 4;

export type AttendanceEventSnapshot = {
  attendances: Array<{ personId: string; status: AttendanceStatus }>;
};

export type AttendanceEvidenceEventSnapshot = AttendanceEventSnapshot & {
  startsAt: Date;
};

export function getRecordedStatusesNewestFirst(eventsNewestFirst: AttendanceEventSnapshot[], personId: string) {
  return eventsNewestFirst.flatMap((event) => {
    const attendance = event.attendances.find((item) => item.personId === personId);
    return attendance ? [attendance.status] : [];
  });
}

export function countConsecutiveAbsences(statusesNewestFirst: AttendanceStatus[]) {
  let count = 0;
  for (const status of statusesNewestFirst) {
    if (status === AttendanceStatus.ABSENT) count += 1;
    else break;
  }
  return count;
}

export function getConsecutiveAbsenceDatesNewestFirst(eventsNewestFirst: AttendanceEvidenceEventSnapshot[], personId: string) {
  const dates: Date[] = [];

  for (const event of eventsNewestFirst) {
    const attendance = event.attendances.find((item) => item.personId === personId);
    if (!attendance) continue;

    if (attendance.status !== AttendanceStatus.ABSENT) break;
    dates.push(event.startsAt);
  }

  return dates;
}

function formatDateList(dates: Date[]) {
  const labels = dates.map((date) => formatBrasiliaShortDate(date));

  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} e ${labels[1]}`;

  return `${labels.slice(0, -1).join(", ")} e ${labels.at(-1)}`;
}

export function describeAttendanceEvidence(absenceDatesNewestFirst: Date[]) {
  if (absenceDatesNewestFirst.length === 0) return null;

  const visibleDates = absenceDatesNewestFirst.slice(0, 3).reverse();
  const dateList = formatDateList(visibleDates);

  if (absenceDatesNewestFirst.length >= 3) {
    return `Ausente nos últimos 3 encontros registrados: ${dateList}.`;
  }

  return `Ausente em: ${dateList}.`;
}

export type AttendanceSignalKind = "attendance-attention" | "attendance-urgent";

function attendanceSignalKindFromSeverity(severity: SignalSeverity | string | null | undefined): AttendanceSignalKind | null {
  if (severity === SignalSeverity.URGENT) return "attendance-urgent";
  if (severity === SignalSeverity.ATTENTION) return "attendance-attention";
  return null;
}

export function describeAttendanceSignal(absences: number, evidence?: string | null) {
  if (absences >= 3) {
    return {
      kind: "attendance-urgent" as const,
      severity: SignalSeverity.URGENT,
      reason: "Ausência recorrente percebida.",
      evidence: evidence ?? "Presença recente pede cuidado mais próximo.",
    };
  }

  if (absences >= 2) {
    return {
      kind: "attendance-attention" as const,
      severity: SignalSeverity.ATTENTION,
      reason: "Ausência recente percebida.",
      evidence: evidence ?? "Presença recente pede atenção.",
    };
  }

  return null;
}

export type DescribedAttendanceSignal = NonNullable<ReturnType<typeof describeAttendanceSignal>>;

export type ResolvedAttendanceSignalSnapshot = {
  kind?: AttendanceSignalKind | null;
  severity?: SignalSeverity | string | null;
  reason: string | null;
  evidence: string | null;
  resolvedAt: Date | null;
};

function legacyAttendanceSignalKind(reason: string | null | undefined, evidence: string | null | undefined): AttendanceSignalKind | null {
  const text = `${reason ?? ""} ${evidence ?? ""}`.toLowerCase();

  // Compatibility only: resolved signals persisted before this helper had a structural kind.
  // New comparisons should use `kind` or `severity`, not UI/copy text.
  if (text.includes("3 faltas") || text.includes("afastamento") || text.includes("recorrente") || text.includes("cuidado mais próximo")) {
    return "attendance-urgent";
  }

  if (text.includes("2 faltas") || text.includes("atenção") || text.includes("ausência recente")) {
    return "attendance-attention";
  }

  return null;
}

function resolvedAttendanceSignalKind(resolvedSignal: ResolvedAttendanceSignalSnapshot): AttendanceSignalKind | null {
  return resolvedSignal.kind
    ?? attendanceSignalKindFromSeverity(resolvedSignal.severity)
    ?? legacyAttendanceSignalKind(resolvedSignal.reason, resolvedSignal.evidence);
}

export function shouldKeepAttendanceSignalResolved(
  signal: DescribedAttendanceSignal,
  latestEvidenceAt: Date | null | undefined,
  resolvedSignal: ResolvedAttendanceSignalSnapshot | null | undefined,
) {
  if (!latestEvidenceAt || !resolvedSignal?.resolvedAt) return false;
  if (latestEvidenceAt.getTime() > resolvedSignal.resolvedAt.getTime()) return false;

  return resolvedAttendanceSignalKind(resolvedSignal) === signal.kind;
}


export type OpenAttendanceSignalSnapshot = {
  id: string;
} | null | undefined;

export type AttendanceSignalSyncPlan =
  | { action: "none" }
  | { action: "keep-open-signal" }
  | { action: "update-open-signal"; signal: DescribedAttendanceSignal; lastEvidenceAt: Date }
  | { action: "create-open-signal"; signal: DescribedAttendanceSignal; lastEvidenceAt: Date };

export function planAttendanceSignalSync(input: {
  signal: DescribedAttendanceSignal | null;
  latestEvidenceAt: Date | null;
  existingOpenSignal?: OpenAttendanceSignalSnapshot;
  lastResolvedAttendanceSignal?: ResolvedAttendanceSignalSnapshot | null;
  fallbackDate: Date;
}): AttendanceSignalSyncPlan {
  const existingOpenSignal = input.existingOpenSignal ?? null;

  if (!input.signal) {
    return existingOpenSignal ? { action: "keep-open-signal" } : { action: "none" };
  }

  const lastEvidenceAt = input.latestEvidenceAt ?? input.fallbackDate;

  if (existingOpenSignal) {
    return { action: "update-open-signal", signal: input.signal, lastEvidenceAt };
  }

  if (shouldKeepAttendanceSignalResolved(input.signal, input.latestEvidenceAt, input.lastResolvedAttendanceSignal)) {
    return { action: "none" };
  }

  return { action: "create-open-signal", signal: input.signal, lastEvidenceAt };
}
