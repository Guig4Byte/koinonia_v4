import { CalendarDays } from "lucide-react";
import { calendarDays, MONTH_NAMES_PT_BR, shiftCalendarMonth, WEEKDAY_LABELS_PT_BR } from "@/features/events/brasilia-date-time";
import type { CalendarMonth, DateParts } from "@/features/events/brasilia-date-time";
import { cn } from "@/lib/cn";

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
      <label className="block text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]" htmlFor="event-start-date">
        Nova data
      </label>
      <div className="event-picker-field">
        <input
          id="event-start-date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="numeric"
          placeholder="dd/mm/aaaa"
          className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)] focus:border-[var(--color-brand)]"
        />
        <button type="button" className="event-picker-trigger" aria-label="Escolher data" aria-expanded={isOpen} onClick={() => onOpenChange(!isOpen)}>
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="event-picker-popover">
            <div className="event-calendar-header">
              <button type="button" onClick={() => onCalendarMonthChange(shiftCalendarMonth(calendarMonth, -1))} aria-label="Mês anterior">
                ‹
              </button>
              <span>
                {MONTH_NAMES_PT_BR[calendarMonth.monthIndex]} {calendarMonth.year}
              </span>
              <button type="button" onClick={() => onCalendarMonthChange(shiftCalendarMonth(calendarMonth, 1))} aria-label="Próximo mês">
                ›
              </button>
            </div>
            <div className="event-calendar-weekdays">
              {WEEKDAY_LABELS_PT_BR.map((label, index) => (
                <span key={`${label}-${index}`}>{label}</span>
              ))}
            </div>
            <div className="event-calendar-grid">
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
                    className={cn("event-calendar-day", selected && "event-calendar-day-selected")}
                    onClick={() => onCalendarDaySelect(day)}
                  >
                    {day}
                  </button>
                ) : (
                  <span key={`empty-${index}`} className="event-calendar-empty" aria-hidden="true" />
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
