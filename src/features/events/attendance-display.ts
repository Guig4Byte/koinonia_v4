export const ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  JUSTIFIED: "JUSTIFIED",
  VISITOR: "VISITOR",
} as const;

export type AttendanceStatusValue = (typeof ATTENDANCE)[keyof typeof ATTENDANCE];
export type MemberAttendanceStatus = Exclude<AttendanceStatusValue, typeof ATTENDANCE.VISITOR>;
export type AttendanceSelection = MemberAttendanceStatus | null;
export type AttendanceTone = "ok" | "warn" | "risk" | "info";
export type AttendanceVisualTone = "present" | "absent" | "justified" | "pending" | "visitor";

export const MEMBER_ATTENDANCE_OPTIONS = [ATTENDANCE.PRESENT, ATTENDANCE.ABSENT, ATTENDANCE.JUSTIFIED] as const;

export const attendanceLabels: Record<AttendanceStatusValue, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

export const memberAttendanceLabels: Record<MemberAttendanceStatus, string> = {
  PRESENT: attendanceLabels.PRESENT,
  ABSENT: attendanceLabels.ABSENT,
  JUSTIFIED: attendanceLabels.JUSTIFIED,
};

export const attendanceStatusDescriptions: Record<MemberAttendanceStatus, string> = {
  PRESENT: "Veio ao encontro.",
  ABSENT: "Não veio e não houve justificativa.",
  JUSTIFIED: "Avisou ou explicou a ausência.",
};

export function isPresentAttendanceStatus(status?: string | null): status is typeof ATTENDANCE.PRESENT {
  return status === ATTENDANCE.PRESENT;
}

export function isAbsentAttendanceStatus(status?: string | null): status is typeof ATTENDANCE.ABSENT {
  return status === ATTENDANCE.ABSENT;
}

export function isJustifiedAttendanceStatus(status?: string | null): status is typeof ATTENDANCE.JUSTIFIED {
  return status === ATTENDANCE.JUSTIFIED;
}

export function isVisitorAttendanceStatus(status?: string | null): status is typeof ATTENDANCE.VISITOR {
  return status === ATTENDANCE.VISITOR;
}

export function isMemberAttendanceStatus(status?: string | null): status is MemberAttendanceStatus {
  return isPresentAttendanceStatus(status) || isAbsentAttendanceStatus(status) || isJustifiedAttendanceStatus(status);
}

export function attendanceLabel(status: AttendanceStatusValue) {
  return attendanceLabels[status];
}

export function memberAttendanceLabel(status: MemberAttendanceStatus) {
  return memberAttendanceLabels[status];
}

export function attendanceStatusDescription(status: MemberAttendanceStatus) {
  return attendanceStatusDescriptions[status];
}

export function attendanceTone(status?: string | null): AttendanceTone {
  if (isPresentAttendanceStatus(status)) return "ok";
  if (isJustifiedAttendanceStatus(status)) return "warn";
  if (isAbsentAttendanceStatus(status)) return "risk";
  return "info";
}

export function attendanceVisualTone(status?: string | null): AttendanceVisualTone {
  if (isPresentAttendanceStatus(status)) return "present";
  if (isAbsentAttendanceStatus(status)) return "absent";
  if (isJustifiedAttendanceStatus(status)) return "justified";
  if (isVisitorAttendanceStatus(status)) return "visitor";
  return "pending";
}
