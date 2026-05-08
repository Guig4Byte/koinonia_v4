import { AttendanceStatus, SignalSeverity } from "../../generated/prisma/client";
import { formatBrasiliaShortDate } from "../../lib/brasilia-time";

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

export function describeAttendanceSignal(absences: number, evidence?: string | null) {
  if (absences >= 3) {
    return {
      severity: SignalSeverity.URGENT,
      reason: "Ausência recorrente percebida.",
      evidence: evidence ?? "Presença recente pede cuidado mais próximo.",
    };
  }

  if (absences >= 2) {
    return {
      severity: SignalSeverity.ATTENTION,
      reason: "Ausência recente percebida.",
      evidence: evidence ?? "Presença recente pede atenção.",
    };
  }

  return null;
}

export type DescribedAttendanceSignal = NonNullable<ReturnType<typeof describeAttendanceSignal>>;

export type ResolvedAttendanceSignalSnapshot = {
  reason: string | null;
  evidence: string | null;
  resolvedAt: Date | null;
};


function attendanceSignalKey(reason: string | null | undefined, evidence: string | null | undefined): string {
  const text = `${reason ?? ""} ${evidence ?? ""}`.toLowerCase();

  if (text.includes("3 faltas") || text.includes("afastamento") || text.includes("recorrente") || text.includes("cuidado mais próximo")) {
    return "attendance-urgent";
  }

  if (text.includes("2 faltas") || text.includes("atenção") || text.includes("ausência recente")) {
    return "attendance-attention";
  }

  return `${reason ?? ""}|${evidence ?? ""}`;
}

export function shouldKeepAttendanceSignalResolved(
  signal: DescribedAttendanceSignal,
  latestEvidenceAt: Date | null | undefined,
  resolvedSignal: ResolvedAttendanceSignalSnapshot | null | undefined,
) {
  if (!latestEvidenceAt || !resolvedSignal?.resolvedAt) return false;
  if (latestEvidenceAt.getTime() > resolvedSignal.resolvedAt.getTime()) return false;

  return attendanceSignalKey(resolvedSignal.reason, resolvedSignal.evidence) === attendanceSignalKey(signal.reason, signal.evidence);
}
