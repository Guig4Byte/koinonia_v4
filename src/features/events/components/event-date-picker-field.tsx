import { CalendarDays } from "lucide-react";
import {
  calendarDays,
  MONTH_NAMES_PT_BR,
  shiftCalendarMonth,
  WEEKDAY_LABELS_PT_BR,
} from "@/features/events/brasilia-date-time";
import type {
  CalendarMonth,
  DateParts,
} from "@/features/events/brasilia-date-time";
import { cn } from "@/lib/cn";
import pickerStyles from "@/components/ui/picker.module.css";
import styles from "./event-date-picker-field.module.css";

export function EventDatePickerField({
  value,
  isOpen,
  calendarMonth,
  selectedDateParts,
  onChange,
  onOpenChange,
  onCalendarMonthChange,
  onCalendarDaySelect,
}: {
  value: string;
  isOpen: boolean;
  calendarMonth: CalendarMonth;
  selectedDateParts: DateParts | null;
  onChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onCalendarMonthChange: (month: CalendarMonth) => void;
  onCalendarDaySelect: (day: number) => void;
}) {
  return (
    <div>
      <label className={pickerStyles.label} htmlFor="event-start-date">
        Nova data
      </label>
      <div className={pickerStyles.field}>
        <input
          id="event-start-date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          className={cn(pickerStyles.input, pickerStyles.inputControl)}
        />
        <button
          type="button"
          className={pickerStyles.trigger}
          aria-label="Escolher data"
          aria-expanded={isOpen}
          onClick={() => onOpenChange(!isOpen)}
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className={pickerStyles.popover}>
            <div className={styles.header}>
              <button
                type="button"
                onClick={() =>
                  onCalendarMonthChange(shiftCalendarMonth(calendarMonth, -1))
                }
                aria-label="Mês anterior"
              >
                ‹
              </button>
              <span>
                {MONTH_NAMES_PT_BR[calendarMonth.monthIndex]}{" "}
                {calendarMonth.year}
              </span>
              <button
                type="button"
                onClick={() =>
                  onCalendarMonthChange(shiftCalendarMonth(calendarMonth, 1))
                }
                aria-label="Próximo mês"
              >
                ›
              </button>
            </div>
            <div className={styles.weekdays}>
              {WEEKDAY_LABELS_PT_BR.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className={styles.grid}>
              {calendarDays(calendarMonth).map((day, index) => {
                const selected = Boolean(
                  day &&
                  selectedDateParts?.year === calendarMonth.year &&
                  selectedDateParts.month === calendarMonth.monthIndex + 1 &&
                  selectedDateParts.day === day,
                );

                return day ? (
                  <button
                    key={`${calendarMonth.year}-${calendarMonth.monthIndex}-${day}`}
                    type="button"
                    className={cn(styles.day, selected && styles.dayActive)}
                    onClick={() => onCalendarDaySelect(day)}
                  >
                    {day}
                  </button>
                ) : (
                  <span
                    key={`empty-${index}`}
                    className={styles.empty}
                    aria-hidden="true"
                  />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
