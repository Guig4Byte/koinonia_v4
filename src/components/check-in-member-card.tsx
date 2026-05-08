"use client";

import { GhostButton } from "@/components/ui/button";
import {
  ATTENDANCE,
  ATTENDANCE_LABELS,
  MEMBER_ATTENDANCE_OPTIONS,
  type AttendanceSelection,
  type CheckInItem,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";

function memberCardTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return "check-in-member-card-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-member-card-absent";
  if (status === ATTENDANCE.JUSTIFIED) return "check-in-member-card-justified";
  return "check-in-member-card-pending";
}

function statusButtonTone(status: MemberAttendanceStatus, selected: boolean) {
  if (!selected) return "check-in-status-button";
  if (status === ATTENDANCE.PRESENT) return "check-in-status-button-selected-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-status-button-selected-absent";
  return "check-in-status-button-selected-justified";
}

function statusBadgeTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return "check-in-status-badge-present";
  if (status === ATTENDANCE.ABSENT) return "check-in-status-badge-absent";
  if (status === ATTENDANCE.JUSTIFIED) return "check-in-status-badge-justified";
  return "check-in-status-badge-pending";
}

type CheckInMemberCardProps = {
  item: CheckInItem;
  onSetStatus: (personId: string, status: MemberAttendanceStatus) => void;
};

export function CheckInMemberCard({ item, onSetStatus }: CheckInMemberCardProps) {
  return (
    <article
      className={cn("check-in-member-card rounded-2xl border p-3 shadow-card", memberCardTone(item.status))}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-semibold text-[var(--color-text-primary)]">{item.fullName}</p>
        <span
          className={cn(
            "check-in-status-badge rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            statusBadgeTone(item.status),
          )}
        >
          {item.status ? ATTENDANCE_LABELS[item.status] : "Pendente"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MEMBER_ATTENDANCE_OPTIONS.map((status) => (
          <GhostButton
            key={status}
            onClick={() => onSetStatus(item.personId, status)}
            className={cn("min-h-10 rounded-xl px-2 text-xs", statusButtonTone(status, item.status === status))}
          >
            {ATTENDANCE_LABELS[status]}
          </GhostButton>
        ))}
      </div>
    </article>
  );
}
