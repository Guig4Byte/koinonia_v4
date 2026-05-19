"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WEEKDAY_OPTIONS } from "@/features/groups/weekdays";
import { useGroupFormDirty } from "@/features/groups/components/group-form-actions";
import { cn } from "@/lib/cn";
import styles from "./group-form.module.css";

const emptyOption = { value: "", label: "Sem dia fixo" };

function dayLabel(value: string) {
  if (!value) return emptyOption.label;
  return WEEKDAY_OPTIONS.find((option) => String(option.value) === value)?.label ?? emptyOption.label;
}

export function GroupMeetingDayInput({
  defaultValue,
  ariaDescribedBy,
  ariaInvalid,
}: {
  defaultValue?: number | null;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
}) {
  const markDirty = useGroupFormDirty();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue === null || defaultValue === undefined ? "" : String(defaultValue));
  const [open, setOpen] = useState(false);
  const options = [emptyOption, ...WEEKDAY_OPTIONS.map((option) => ({ value: String(option.value), label: option.label }))];

  useEffect(() => {
    if (!open) return;

    function closeOnOutsidePointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectValue(nextValue: string) {
    setValue(nextValue);
    setOpen(false);
    markDirty?.();
  }

  return (
    <div ref={rootRef} className={styles.dayPicker}>
      <input type="hidden" name="meetingDayOfWeek" value={value} />
      <button
        id="meeting-day-of-week"
        type="button"
        className={cn(styles.dayButton, ariaInvalid && styles.controlInvalid)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={ariaDescribedBy}
        data-invalid={ariaInvalid || undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays className={styles.dayIcon} aria-hidden="true" />
        <span className={styles.dayValue}>{dayLabel(value)}</span>
        <ChevronDown className={cn(styles.dayChevron, open && styles.dayChevronOpen)} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.dayPopover} role="listbox" aria-labelledby="meeting-day-of-week">
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value || "empty"}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(styles.dayOption, selected && styles.dayOptionSelected)}
                onClick={() => selectValue(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
