"use client";

import { Clock3 } from "lucide-react";
import { useState } from "react";
import {
  CLOCK_TIME_FORMAT_HINT,
  CLOCK_TIME_INPUT_MAX_LENGTH,
  CLOCK_TIME_PATTERN,
} from "@/features/events/time-validation";
import { cn } from "@/lib/cn";

const defaultTimePickerInputClassName =
  "event-picker-input min-h-11 w-full rounded-2xl border border-[var(--color-border-card)] bg-[var(--metric-card-bg)] text-[length:var(--text-sm)] text-[color:var(--color-text-primary)] outline-none placeholder:text-[color:var(--color-text-muted)] focus:border-[var(--color-brand)]";

type TimePickerFieldProps = {
  id: string;
  name?: string;
  label?: string;
  value?: string;
  defaultValue?: string | null;
  isOpen?: boolean;
  timeOptions?: ReadonlyArray<string>;
  getTimeOptions?: (currentValue: string) => ReadonlyArray<string>;
  placeholder?: string;
  ariaLabel?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  pattern?: string;
  title?: string;
  maxLength?: number;
  className?: string;
  labelClassName?: string;
  fieldClassName?: string;
  inputClassName?: string;
  popoverClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  onChange?: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
  onTimeSelect?: (time: string) => void;
};

export function TimePickerField({
  id,
  name,
  label,
  value,
  defaultValue,
  isOpen,
  timeOptions,
  getTimeOptions,
  placeholder = "HH:mm",
  ariaLabel = "Escolher horário",
  autoComplete = "off",
  disabled,
  required,
  pattern = CLOCK_TIME_PATTERN,
  title = CLOCK_TIME_FORMAT_HINT,
  maxLength = CLOCK_TIME_INPUT_MAX_LENGTH,
  className,
  labelClassName,
  fieldClassName,
  inputClassName,
  popoverClassName,
  optionClassName,
  selectedOptionClassName,
  onChange,
  onOpenChange,
  onTimeSelect,
}: TimePickerFieldProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [internalOpen, setInternalOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const open = isOpen ?? internalOpen;
  const resolvedTimeOptions = timeOptions ?? getTimeOptions?.(currentValue) ?? [];

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  function updateOpen(nextOpen: boolean) {
    if (isOpen === undefined) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  function selectTime(time: string) {
    updateValue(time);
    onTimeSelect?.(time);
    updateOpen(false);
  }

  return (
    <div className={className}>
      {label ? (
        <label
          className={cn(
            "block text-[length:var(--text-xs)] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-text-secondary)]",
            labelClassName,
          )}
          htmlFor={id}
        >
          {label}
        </label>
      ) : null}

      <div className={cn("event-picker-field", fieldClassName)}>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete={autoComplete}
          placeholder={placeholder}
          maxLength={maxLength}
          pattern={pattern}
          title={title}
          value={currentValue}
          disabled={disabled}
          required={required}
          onChange={(event) => updateValue(event.target.value)}
          className={cn(defaultTimePickerInputClassName, inputClassName)}
        />
        <button
          type="button"
          className="event-picker-trigger"
          aria-label={ariaLabel}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => updateOpen(!open)}
        >
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </button>
        {open ? (
          <div className={cn("event-picker-popover event-time-popover", popoverClassName)}>
            {resolvedTimeOptions.map((time) => (
              <button
                key={time}
                type="button"
                className={cn(
                  "event-time-option",
                  optionClassName,
                  currentValue === time && cn("event-time-option-selected", selectedOptionClassName),
                )}
                onClick={() => selectTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
