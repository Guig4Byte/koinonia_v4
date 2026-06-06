"use client";

import { Clock3 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLOCK_TIME_FORMAT_HINT,
  CLOCK_TIME_INPUT_MAX_LENGTH,
  CLOCK_TIME_PATTERN,
} from "@/lib/clock-time";
import { cn } from "@/lib/cn";
import pickerStyles from "./picker.module.css";
import styles from "./time-picker-field.module.css";

type PickerSurface = "default" | "warm";
type PickerFieldSpacing = "label" | "none";
type PickerPopoverWidth = "default" | "compact" | "control";

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
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
  pattern?: string;
  title?: string;
  maxLength?: number;
  surface?: PickerSurface;
  fieldSpacing?: PickerFieldSpacing;
  popoverWidth?: PickerPopoverWidth;
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
  ariaDescribedBy,
  ariaInvalid,
  autoComplete = "off",
  disabled,
  required,
  pattern = CLOCK_TIME_PATTERN,
  title = CLOCK_TIME_FORMAT_HINT,
  maxLength = CLOCK_TIME_INPUT_MAX_LENGTH,
  surface = "default",
  fieldSpacing = "label",
  popoverWidth = "default",
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
  const fieldRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const [internalOpen, setInternalOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const open = isOpen ?? internalOpen;
  const resolvedTimeOptions =
    timeOptions ?? getTimeOptions?.(currentValue) ?? [];

  const updateOpen = useCallback(
    (nextOpen: boolean) => {
      if (isOpen === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isOpen, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) {
        updateOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") updateOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, updateOpen]);

  function updateValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  function selectTime(time: string) {
    updateValue(time);
    onTimeSelect?.(time);
    updateOpen(false);
  }

  return (
    <div className={className}>
      {label ? (
        <label className={cn(pickerStyles.label, labelClassName)} htmlFor={id}>
          {label}
        </label>
      ) : null}

      <div
        ref={fieldRef}
        className={cn(
          pickerStyles.field,
          fieldSpacing === "none" && pickerStyles.fieldFlush,
          fieldClassName,
        )}
      >
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
          aria-describedby={ariaDescribedBy}
          aria-invalid={ariaInvalid || undefined}
          onChange={(event) => updateValue(event.target.value)}
          className={cn(
            pickerStyles.input,
            pickerStyles.inputControl,
            surface === "warm" && pickerStyles.inputWarm,
            ariaInvalid && pickerStyles.inputInvalid,
            inputClassName,
          )}
        />
        <button
          type="button"
          className={cn(
            pickerStyles.trigger,
            surface === "warm" && pickerStyles.triggerWarm,
          )}
          aria-label={ariaLabel}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => updateOpen(!open)}
        >
          <Clock3 className="h-4 w-4" aria-hidden="true" />
        </button>
        {open ? (
          <div
            className={cn(
              pickerStyles.popover,
              surface === "warm" && pickerStyles.popoverWarm,
              popoverWidth === "compact" && pickerStyles.popoverCompact,
              popoverWidth === "control" && pickerStyles.popoverControlWidth,
              styles.popover,
              popoverClassName,
            )}
          >
            {resolvedTimeOptions.map((time) => (
              <button
                key={time}
                type="button"
                className={cn(
                  styles.option,
                  optionClassName,
                  currentValue === time &&
                    cn(styles.optionSelected, selectedOptionClassName),
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
