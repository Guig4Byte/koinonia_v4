import type { CalendarMonth, DateParts } from "@/features/events/brasilia-date-time";
import type { OpenEventPicker } from "@/features/events/event-actions-view";
import { GhostButton } from "@/components/ui/button";
import { EventDatePickerField } from "@/components/event-date-picker-field";
import { EventTimePickerField } from "@/components/event-time-picker-field";

export function EventRescheduleAction({
  localDate,
  localTime,
  openPicker,
  calendarMonth,
  selectedDateParts,
  disabled,
  onDateChange,
  onTimeChange,
  onOpenPickerChange,
  onCalendarMonthChange,
  onCalendarDaySelect,
  onTimeSelect,
  onReschedule,
}: {
  localDate: string;
  localTime: string;
  openPicker: OpenEventPicker;
  calendarMonth: CalendarMonth;
  selectedDateParts: DateParts | null;
  disabled: boolean;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onOpenPickerChange: (picker: OpenEventPicker) => void;
  onCalendarMonthChange: (month: CalendarMonth) => void;
  onCalendarDaySelect: (day: number) => void;
  onTimeSelect: (time: string) => void;
  onReschedule: () => void;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-[var(--color-border-divider)] bg-[var(--surface-alt)] p-3">
      <p className="k-item-title-sm">Remarcar encontro</p>
      <p className="k-item-detail">
        Use quando a célula vai se reunir em outro dia ou horário. O local informado acima será salvo junto.
      </p>
      <div className="event-reschedule-fields mt-3">
        <EventDatePickerField
          value={localDate}
          isOpen={openPicker === "date"}
          calendarMonth={calendarMonth}
          selectedDateParts={selectedDateParts}
          onChange={onDateChange}
          onOpenChange={(isOpen) => onOpenPickerChange(isOpen ? "date" : null)}
          onCalendarMonthChange={onCalendarMonthChange}
          onCalendarDaySelect={onCalendarDaySelect}
        />
        <EventTimePickerField
          value={localTime}
          isOpen={openPicker === "time"}
          onChange={onTimeChange}
          onOpenChange={(isOpen) => onOpenPickerChange(isOpen ? "time" : null)}
          onTimeSelect={onTimeSelect}
        />
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        Data e horário seguem Brasília (UTC-3), em formato 24h.
      </p>
      <GhostButton type="button" onClick={onReschedule} disabled={disabled} className="mt-3 w-full rounded-xl">
        Remarcar encontro
      </GhostButton>
    </div>
  );
}
