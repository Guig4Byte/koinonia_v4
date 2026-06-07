"use client";

import { CalendarDays } from "lucide-react";
import { ChoicePickerField } from "@/components/ui/choice-picker-field";
import { WEEKDAY_OPTIONS } from "@/features/groups/weekdays";

const emptyOption = { value: "", label: "Sem dia fixo" };

export function GroupMeetingDayInput({
  defaultValue,
  ariaDescribedBy,
  ariaInvalid,
}: {
  defaultValue?: number | null;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}) {
  const defaultPickerValue =
    defaultValue === null || defaultValue === undefined
      ? ""
      : String(defaultValue);
  const options = [
    emptyOption,
    ...WEEKDAY_OPTIONS.map((option) => ({
      value: String(option.value),
      label: option.label,
    })),
  ];

  return (
    <ChoicePickerField
      id="meeting-day-of-week"
      name="meetingDayOfWeek"
      defaultValue={defaultPickerValue}
      options={options}
      icon={<CalendarDays />}
      surface="warm"
      fieldSpacing="none"
      popoverWidth="control"
      ariaDescribedBy={ariaDescribedBy}
      ariaInvalid={ariaInvalid}
    />
  );
}
