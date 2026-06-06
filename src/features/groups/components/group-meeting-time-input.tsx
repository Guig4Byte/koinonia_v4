"use client";

import { TimePickerField } from "@/components/ui/time-picker-field";
import { useGroupFormDirty } from "@/features/groups/components/group-form-actions";
import { timeOptionsWithCurrent } from "@/features/events/time-options";

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
      surface="warm"
      fieldSpacing="none"
      popoverWidth="compact"
      onChange={markDirty ?? undefined}
      onTimeSelect={markDirty ?? undefined}
    />
  );
}
