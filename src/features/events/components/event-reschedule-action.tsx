import type { CalendarMonth, DateParts } from "@/features/events/brasilia-date-time";
import type { OpenEventPicker } from "@/features/events/event-actions-view";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EventDatePickerField } from "@/features/events/components/event-date-picker-field";
import { EventTimePickerField } from "@/features/events/components/event-time-picker-field";
import styles from "./event-reschedule-action.module.css";

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
    <ActionPanel
      title="Remarcar encontro"
      description="Para quando a célula vai se reunir em outro dia ou horário. O local pode ser ajustado separadamente, se também mudou."
      className="mt-4"
    >
      <div className={styles.fields}>
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
      <p className="k-item-detail-tight">
        Data e horário seguem Brasília (UTC-3), em formato 24h.
      </p>
      <Button type="button" variant="secondary" shape="soft" fullWidth onClick={onReschedule} disabled={disabled} className="mt-3">
        Remarcar encontro
      </Button>
    </ActionPanel>
  );
}
