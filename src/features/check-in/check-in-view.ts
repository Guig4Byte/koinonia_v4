import {
  ATTENDANCE,
  MEMBER_ATTENDANCE_OPTIONS,
  memberAttendanceLabels as ATTENDANCE_LABELS,
  attendanceStatusDescription,
  isMemberAttendanceStatus,
  isPresentAttendanceStatus,
  isAbsentAttendanceStatus,
  isJustifiedAttendanceStatus,
  type AttendanceSelection,
  type AttendanceStatusValue as AttendanceStatus,
  type MemberAttendanceStatus,
} from "@/features/events/attendance-display";

export { ATTENDANCE, ATTENDANCE_LABELS, MEMBER_ATTENDANCE_OPTIONS };
export type { AttendanceSelection, AttendanceStatus, MemberAttendanceStatus };

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

export const CHECK_IN_MEMBER_FILTERS = ["all", "pending", "present", "absent", "justified"] as const satisfies readonly CheckInMemberFilter[];

const checkInFilterLabels: Record<CheckInMemberFilter, string> = {
  all: "Todos",
  pending: "Sem marcação",
  present: "Presentes",
  absent: "Ausentes",
  justified: "Justificaram",
};

export function getInitialMemberStatus(status?: AttendanceStatus | null): AttendanceSelection {
  return isMemberAttendanceStatus(status) ? status : null;
}

export function summarizeCheckInItems(items: CheckInItem[], visitorTotal: number): CheckInSummary {
  const counts = items.reduce(
    (acc, item) => {
      if (isPresentAttendanceStatus(item.status)) acc.present += 1;
      else if (isJustifiedAttendanceStatus(item.status)) acc.justified += 1;
      else if (isAbsentAttendanceStatus(item.status)) acc.absent += 1;
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

export function sortCheckInItemsForDisplay(items: CheckInItem[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      if (a.item.status === null && b.item.status !== null) return -1;
      if (a.item.status !== null && b.item.status === null) return 1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

export function filterCheckInItems(items: CheckInItem[], filter: CheckInMemberFilter) {
  if (filter === "all") return items;
  if (filter === "pending") return items.filter((item) => item.status === null);
  if (filter === "present") return items.filter((item) => isPresentAttendanceStatus(item.status));
  if (filter === "absent") return items.filter((item) => isAbsentAttendanceStatus(item.status));
  return items.filter((item) => isJustifiedAttendanceStatus(item.status));
}

export function checkInFilteredEmptyMessage(filter: CheckInMemberFilter) {
  if (filter === "pending") return "Nenhum irmão sem marcação neste encontro.";
  if (filter === "present") return "Nenhum irmão marcado como presente ainda.";
  if (filter === "absent") return "Nenhuma ausência marcada neste encontro.";
  if (filter === "justified") return "Nenhuma justificativa marcada neste encontro.";
  return "Nenhum membro encontrado neste encontro.";
}

export function checkInStatusOptionDescription(status: MemberAttendanceStatus) {
  return attendanceStatusDescription(status);
}

export function checkInConfirmationParam(mode: CheckInMode) {
  return mode === "adjust" ? "atualizada" : "registrada";
}
