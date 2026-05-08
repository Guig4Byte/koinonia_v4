import { CalendarDays, Clock3 } from "lucide-react";
import {
  calendarDays,
  MONTH_NAMES_PT_BR,
  shiftCalendarMonth,
  WEEKDAY_LABELS_PT_BR,
} from "@/features/events/brasilia-date-time";
import type { CalendarMonth, DateParts } from "@/features/events/brasilia-date-time";
import type { OpenEventPicker } from "@/features/events/event-actions-view";
import { cn } from "@/lib/cn";
import { GhostButton } from "@/components/ui/button";

export function EventRescheduleAction({
  localDate,
  localTime,
  openPicker,
  calendarMonth,
  selectedDateParts,
  timeOptions,
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
  timeOptions: string[];
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
      <p className="text-sm font-semibold text-[var(--color-text-primary)]">Remarcar encontro</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        Use quando a célula vai se reunir em outro dia ou horário. O local informado acima será salvo junto.
      </p>
      <div className="event-reschedule-fields mt-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-date">
            Nova data
          </label>
          <div className="event-picker-field">
            <input
              id="event-start-date"
              value={localDate}
              onChange={(event) => onDateChange(event.target.value)}
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
            />
            <button
              type="button"
              className="event-picker-trigger"
              aria-label="Escolher data"
              aria-expanded={openPicker === "date"}
              onClick={() => onOpenPickerChange(openPicker === "date" ? null : "date")}
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
            </button>
            {openPicker === "date" ? (
              <div className="event-picker-popover event-calendar-popover">
                <div className="event-calendar-header">
                  <button type="button" onClick={() => onCalendarMonthChange(shiftCalendarMonth(calendarMonth, -1))} aria-label="Mês anterior">
                    ‹
                  </button>
                  <span>{MONTH_NAMES_PT_BR[calendarMonth.monthIndex]} {calendarMonth.year}</span>
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
        <div>
          <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-time">
            Novo horário
          </label>
          <div className="event-picker-field">
            <input
              id="event-start-time"
              value={localTime}
              onChange={(event) => onTimeChange(event.target.value)}
              inputMode="numeric"
              placeholder="HH:mm"
              maxLength={5}
              className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
            />
            <button
              type="button"
              className="event-picker-trigger"
              aria-label="Escolher horário"
              aria-expanded={openPicker === "time"}
              onClick={() => onOpenPickerChange(openPicker === "time" ? null : "time")}
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
            </button>
            {openPicker === "time" ? (
              <div className="event-picker-popover event-time-popover">
                {timeOptions.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={cn("event-time-option", localTime === time && "event-time-option-selected")}
                    onClick={() => onTimeSelect(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
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
