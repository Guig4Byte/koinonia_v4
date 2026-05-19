"use client";

import { TimePickerField } from "@/components/ui/time-picker-field";
import { useGroupFormDirty } from "@/features/groups/components/group-form-actions";
import { timeOptionsWithCurrent } from "@/features/events/time-options";
import { cn } from "@/lib/cn";
import styles from "./group-form.module.css";

export function GroupMeetingTimeInput({
  defaultValue,
  ariaDescribedBy,
  ariaInvalid,
}: {
  defaultValue?: string | null;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}) {
  const markDirty = useGroupFormDirty();

  return (
    <TimePickerField
      id="meeting-time"
      name="meetingTime"
      defaultValue={defaultValue}
      getTimeOptions={timeOptionsWithCurrent}
      placeholder="hh:mm"
      ariaLabel="Escolher horário padrão"
      ariaDescribedBy={ariaDescribedBy}
      ariaInvalid={ariaInvalid}
      onChange={markDirty ?? undefined}
      onTimeSelect={markDirty ?? undefined}
      fieldClassName={styles.timeField}
      inputClassName={cn(
        styles.timeInput,
        ariaInvalid && "border-[var(--color-metric-atencoes)] focus:border-[var(--color-metric-atencoes)]",
      )}
      popoverClassName={styles.timePopover}
    />
  );
}
