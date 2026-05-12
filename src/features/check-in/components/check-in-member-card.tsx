"use client";

import { Button, type ButtonVariant } from "@/components/ui/button";
import {
  ATTENDANCE,
  ATTENDANCE_LABELS,
  MEMBER_ATTENDANCE_OPTIONS,
  type AttendanceSelection,
  type CheckInItem,
  type MemberAttendanceStatus,
} from "@/features/check-in/check-in-view";
import { cn } from "@/lib/cn";
import styles from "./check-in.module.css";

function memberCardTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return styles.memberCardPresent;
  if (status === ATTENDANCE.ABSENT) return styles.memberCardAbsent;
  if (status === ATTENDANCE.JUSTIFIED) return styles.memberCardJustified;
  return styles.memberCardPending;
}

function statusButtonVariant(status: MemberAttendanceStatus, selected: boolean): ButtonVariant {
  if (!selected) return "secondary";
  if (status === ATTENDANCE.PRESENT) return "stableSoft";
  if (status === ATTENDANCE.ABSENT) return "dangerSoft";
  return "attentionSoft";
}

function statusBadgeTone(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return styles.statusBadgePresent;
  if (status === ATTENDANCE.ABSENT) return styles.statusBadgeAbsent;
  if (status === ATTENDANCE.JUSTIFIED) return styles.statusBadgeJustified;
  return styles.statusBadgePending;
}

type CheckInMemberCardProps = {
  item: CheckInItem;
  onSetStatus: (personId: string, status: MemberAttendanceStatus) => void;
  disabled?: boolean;
};

export function CheckInMemberCard({ item, onSetStatus, disabled = false }: CheckInMemberCardProps) {
  return (
    <article
      className={cn(styles.memberCard, "rounded-2xl border p-3", memberCardTone(item.status))}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="k-item-title">{item.fullName}</p>
        <span
          className={cn(
            styles.statusBadge,
            "rounded-full border px-2.5 py-1 text-[length:var(--text-xs)] font-semibold",
            statusBadgeTone(item.status),
          )}
        >
          {item.status ? ATTENDANCE_LABELS[item.status] : "Pendente"}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MEMBER_ATTENDANCE_OPTIONS.map((status) => (
          <Button
            key={status}
            type="button"
            variant={statusButtonVariant(status, item.status === status)}
            size="sm"
            aria-pressed={item.status === status}
            onClick={() => onSetStatus(item.personId, status)}
            disabled={disabled}
            className="min-h-11 rounded-xl px-2 text-[length:var(--text-sm)]"
          >
            {ATTENDANCE_LABELS[status]}
          </Button>
        ))}
      </div>
    </article>
  );
}
