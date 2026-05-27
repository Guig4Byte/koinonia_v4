export type MemberAttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED";
export type AttendanceStatus = MemberAttendanceStatus | "VISITOR";
export type AttendanceSelection = MemberAttendanceStatus | null;
export type CheckInMode = "register" | "adjust";
export type CheckInMemberFilter = "all" | "pending" | "present" | "absent" | "justified";

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
export const CHECK_IN_MEMBER_FILTERS = ["all", "pending", "present", "absent", "justified"] as const satisfies readonly CheckInMemberFilter[];

export const ATTENDANCE_LABELS: Record<MemberAttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
};

const checkInFilterLabels: Record<CheckInMemberFilter, string> = {
  all: "Todos",
  pending: "Sem marcação",
  present: "Presentes",
  absent: "Ausentes",
  justified: "Justificaram",
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

export function markedMembersCount(summary: CheckInSummary) {
  return Math.max(0, summary.totalMembers - summary.pending);
}

export function checkInMarkedLabel(summary: CheckInSummary) {
  if (summary.totalMembers === 0) return "Nenhum membro";

  return `${markedMembersCount(summary)} de ${summary.totalMembers} marcados`;
}

export function checkInFilterLabel(filter: CheckInMemberFilter) {
  return checkInFilterLabels[filter];
}

export function checkInFilterCount(summary: CheckInSummary, filter: CheckInMemberFilter) {
  if (filter === "all") return summary.totalMembers;
  if (filter === "pending") return summary.pending;
  if (filter === "present") return summary.present;
  if (filter === "absent") return summary.absent;
  return summary.justified;
}

export function filterCheckInItems(items: CheckInItem[], filter: CheckInMemberFilter) {
  if (filter === "all") return items;
  if (filter === "pending") return items.filter((item) => item.status === null);
  if (filter === "present") return items.filter((item) => item.status === ATTENDANCE.PRESENT);
  if (filter === "absent") return items.filter((item) => item.status === ATTENDANCE.ABSENT);
  return items.filter((item) => item.status === ATTENDANCE.JUSTIFIED);
}

export function checkInFilteredEmptyMessage(filter: CheckInMemberFilter) {
  if (filter === "pending") return "Nenhuma pessoa sem marcação neste encontro.";
  if (filter === "present") return "Nenhuma pessoa marcada como presente ainda.";
  if (filter === "absent") return "Nenhuma ausência marcada neste encontro.";
  if (filter === "justified") return "Nenhuma justificativa marcada neste encontro.";
  return "Nenhum membro encontrado neste encontro.";
}

export function checkInStatusOptionDescription(status: MemberAttendanceStatus) {
  if (status === ATTENDANCE.PRESENT) return "Veio ao encontro.";
  if (status === ATTENDANCE.ABSENT) return "Não veio e não houve justificativa.";
  return "Avisou ou explicou a ausência.";
}

export function checkInConfirmationParam(mode: CheckInMode) {
  return mode === "adjust" ? "atualizada" : "registrada";
}
