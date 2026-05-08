export type MemberAttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED";
export type AttendanceStatus = MemberAttendanceStatus | "VISITOR";
export type AttendanceSelection = MemberAttendanceStatus | null;
export type CheckInMode = "register" | "adjust";

export type CheckInItem = {
  personId: string;
  fullName: string;
  status: AttendanceSelection;
};

export type CheckInSummary = {
  totalMembers: number;
  present: number;
  justified: number;
  absent: number;
  pending: number;
  visitorTotal: number;
  presenceRate: number;
  hasPresenceData: boolean;
};

export const ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  JUSTIFIED: "JUSTIFIED",
  VISITOR: "VISITOR",
} as const satisfies Record<AttendanceStatus, AttendanceStatus>;

export const MEMBER_ATTENDANCE_OPTIONS = [ATTENDANCE.PRESENT, ATTENDANCE.ABSENT, ATTENDANCE.JUSTIFIED] as const;

export const ATTENDANCE_LABELS: Record<MemberAttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
};

export function getInitialMemberStatus(status?: AttendanceStatus | null): AttendanceSelection {
  if (!status || status === ATTENDANCE.VISITOR) return null;
  return status;
}

export function summarizeCheckInItems(items: CheckInItem[], visitorTotal: number): CheckInSummary {
  const counts = items.reduce(
    (acc, item) => {
      if (item.status === ATTENDANCE.PRESENT) acc.present += 1;
      else if (item.status === ATTENDANCE.JUSTIFIED) acc.justified += 1;
      else if (item.status === ATTENDANCE.ABSENT) acc.absent += 1;
      else acc.pending += 1;

      return acc;
    },
    {
      totalMembers: items.length,
      present: 0,
      justified: 0,
      absent: 0,
      pending: 0,
    },
  );

  const hasPresenceData = counts.totalMembers > 0 && counts.pending === 0;
  const presenceRate = hasPresenceData ? Math.round((counts.present / counts.totalMembers) * 100) : 0;

  return {
    ...counts,
    visitorTotal,
    presenceRate,
    hasPresenceData,
  };
}

export function checkInHelperText(mode: CheckInMode) {
  return mode === "adjust"
    ? "Corrija apenas o que mudou neste encontro."
    : "Marque quem veio. Só isso já ajuda a lembrar quem pode precisar de cuidado.";
}

export function checkInConfirmationParam(mode: CheckInMode) {
  return mode === "adjust" ? "atualizada" : "registrada";
}
