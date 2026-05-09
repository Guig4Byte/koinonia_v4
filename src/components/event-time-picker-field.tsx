import { Clock3 } from "lucide-react";
import { CLOCK_TIME_INPUT_MAX_LENGTH } from "@/features/events/time-validation";
import { cn } from "@/lib/cn";

export function EventTimePickerField({
  value,
  isOpen,
  timeOptions,
  onChange,
  onOpenChange,
  onTimeSelect,
}: {
  value: string;
  isOpen: boolean;
  timeOptions: string[];
  onChange: (value: string) => void;
  onOpenChange: (isOpen: boolean) => void;
  onTimeSelect: (time: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]" htmlFor="event-start-time">
        Novo horário
      </label>
      <div className="event-picker-field">
        <input
          id="event-start-time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode="numeric"
          placeholder="HH:mm"
          maxLength={CLOCK_TIME_INPUT_MAX_LENGTH}
          className="event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)]"
        />
        <button type="button" className="event-picker-trigger" aria-label="Escolher horário" aria-expanded={isOpen} onClick={() => onOpenChange(!isOpen)}>
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="event-picker-popover event-time-popover">
            {timeOptions.map((time) => (
              <button key={time} type="button" className={cn("event-time-option", value === time && "event-time-option-selected")} onClick={() => onTimeSelect(time)}>
                {time}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
