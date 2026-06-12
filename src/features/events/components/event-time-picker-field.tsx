"use client";

import { TimePickerField } from "@/components/ui/time-picker-field";
import { timeOptionsWithCurrent } from "@/features/events/time-options";

export function EventTimePickerField({
  id = "event-start-time",
  label = "Novo horário",
  value,
  isOpen,
  onChange,
  onOpenChange,
  onTimeSelect,
}: {
  id?: string;
  label?: string;
  value: string;
  isOpen: boolean;
  onChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onTimeSelect: (time: string) => void;
}) {
  return (
    <TimePickerField
      id={id}
      label={label}
      value={value}
      isOpen={isOpen}
      getTimeOptions={timeOptionsWithCurrent}
      onChange={onChange}
      onOpenChange={onOpenChange}
      onTimeSelect={onTimeSelect}
    />
  );
}
