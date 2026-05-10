"use client";

import { TimePickerField } from "@/components/ui/time-picker-field";
import { timeOptionsWithCurrent } from "@/features/events/time-options";

export function EventTimePickerField({
  value,
  isOpen,
  onChange,
  onOpenChange,
  onTimeSelect,
}: {
  value: string;
  isOpen: boolean;
  onChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onTimeSelect: (time: string) => void;
}) {
  return (
    <TimePickerField
      id="event-start-time"
      label="Novo horário"
      value={value}
      isOpen={isOpen}
      getTimeOptions={timeOptionsWithCurrent}
      onChange={onChange}
      onOpenChange={onOpenChange}
      onTimeSelect={onTimeSelect}
    />
  );
}
