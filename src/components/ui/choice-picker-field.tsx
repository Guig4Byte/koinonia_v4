"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./picker.module.css";

type PickerSurface = "default" | "warm";
type PickerFieldSpacing = "label" | "none";
type PickerPopoverWidth = "default" | "compact" | "control";

type ChoicePickerOption = {
  value: string;
  label: string;
};

type ChoicePickerFieldProps = {
  id: string;
  name: string;
  options: ReadonlyArray<ChoicePickerOption>;
  value?: string;
  defaultValue?: string;
  isOpen?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  disabled?: boolean;
  surface?: PickerSurface;
  fieldSpacing?: PickerFieldSpacing;
  popoverWidth?: PickerPopoverWidth;
  icon?: ReactNode;
  className?: string;
  buttonClassName?: string;
  popoverClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
};

function optionLabel(
  options: ReadonlyArray<ChoicePickerOption>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? "";
}

export function ChoicePickerField({
  id,
  name,
  options,
  value,
  defaultValue = "",
  isOpen,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid,
  disabled,
  surface = "default",
  fieldSpacing = "label",
  popoverWidth = "control",
  icon,
  className,
  buttonClassName,
  popoverClassName,
  optionClassName,
  selectedOptionClassName,
  onValueChange,
  onOpenChange,
}: ChoicePickerFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(false);
  const currentValue = value ?? internalValue;
  const open = isOpen ?? internalOpen;
  const currentLabel = optionLabel(options, currentValue);

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
      if (!rootRef.current?.contains(event.target as Node)) {
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

  function selectValue(nextValue: string) {
    if (value === undefined) setInternalValue(nextValue);
    updateOpen(false);
    onValueChange?.(nextValue);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        styles.field,
        fieldSpacing === "none" && styles.fieldFlush,
        className,
      )}
    >
      <input type="hidden" name={name} value={currentValue} />
      <button
        id={id}
        type="button"
        className={cn(
          styles.choiceButton,
          surface === "warm" && styles.choiceButtonWarm,
          ariaInvalid && styles.choiceButtonInvalid,
          buttonClassName,
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={ariaDescribedBy}
        data-invalid={ariaInvalid || undefined}
        disabled={disabled}
        onClick={() => updateOpen(!open)}
      >
        {icon ? (
          <span className={styles.choiceIcon} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={styles.choiceValue}>{currentLabel}</span>
        <span
          className={cn(styles.choiceChevron, open && styles.choiceChevronOpen)}
          aria-hidden="true"
        >
          <ChevronDown />
        </span>
      </button>
      {open ? (
        <div
          className={cn(
            styles.popover,
            styles.choiceOptions,
            surface === "warm" && styles.popoverWarm,
            popoverWidth === "compact" && styles.popoverCompact,
            popoverWidth === "control" && styles.popoverControlWidth,
            popoverClassName,
          )}
          role="listbox"
          aria-labelledby={id}
        >
          {options.map((option) => {
            const selected = option.value === currentValue;

            return (
              <button
                key={option.value || "empty"}
                type="button"
                role="option"
                aria-selected={selected}
                className={cn(
                  styles.choiceOption,
                  surface === "warm" && styles.choiceOptionWarm,
                  optionClassName,
                  selected &&
                    cn(
                      styles.choiceOptionSelected,
                      surface === "warm" && styles.choiceOptionWarmSelected,
                      selectedOptionClassName,
                    ),
                )}
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
