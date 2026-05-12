"use client";

import { TimePickerField } from "@/components/ui/time-picker-field";
import { timeOptionsWithCurrent } from "@/features/events/time-options";
import styles from "./group-form.module.css";

const groupMeetingTimeInputClassName =
  "min-h-12 bg-[var(--surface-alt)] font-medium transition focus:bg-[var(--color-bg-card)]";

export function GroupMeetingTimeInput({ defaultValue }: { defaultValue?: string | null }) {
  return (
    <TimePickerField
      id="meeting-time"
      name="meetingTime"
      defaultValue={defaultValue}
      getTimeOptions={timeOptionsWithCurrent}
      placeholder="hh:mm"
      ariaLabel="Escolher horário padrão"
      fieldClassName={styles.timeField}
      inputClassName={groupMeetingTimeInputClassName}
      popoverClassName={styles.timePopover}
    />
  );
}
