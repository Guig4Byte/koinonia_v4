import { AttendanceStatus, SignalSeverity } from "../../generated/prisma/client";

export function countConsecutiveAbsences(statusesNewestFirst: AttendanceStatus[]) {
  let count = 0;
  for (const status of statusesNewestFirst) {
    if (status === AttendanceStatus.ABSENT) count += 1;
    else break;
  }
  return count;
}

export function describeAttendanceSignal(absences: number) {
  if (absences >= 3) {
    return {
      severity: SignalSeverity.URGENT,
      reason: `${absences} faltas seguidas. Pode estar se afastando.`,
      evidence: "Presença recente indica afastamento.",
    };
  }

  if (absences >= 2) {
    return {
      severity: SignalSeverity.ATTENTION,
      reason: `${absences} faltas seguidas. Merece uma mensagem simples.`,
      evidence: "Presença recente indica atenção.",
    };
  }

  return null;
}
