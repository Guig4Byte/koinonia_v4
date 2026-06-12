"use client";

import { ChevronDown, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeSearchText } from "@/lib/text";
import { cn } from "@/lib/cn";
import styles from "./picker.module.css";

type PickerSurface = "default" | "warm";
type PickerFieldSpacing = "label" | "none";
type PickerPopoverWidth = "default" | "compact" | "control";

type ChoicePickerOption = {
  value: string;
  label: string;
  description?: string;
  searchText?: string;
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
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  maxVisibleOptions?: number;
  pinnedOptionValues?: ReadonlyArray<string>;
  moreResultsMessage?: (hiddenCount: number) => string;
  onValueChange?: (value: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
};

function optionLabel(
  options: ReadonlyArray<ChoicePickerOption>,
  value: string,
) {
  return options.find((option) => option.value === value)?.label ?? "";
}

function optionSearchText(option: ChoicePickerOption) {
  return normalizeSearchText(
    [option.label, option.description, option.searchText]
      .filter(Boolean)
      .join(" "),
  );
}

function visibleOptions({
  options,
  query,
  searchable,
  maxVisibleOptions,
  pinnedOptionValues = [],
}: {
  options: ReadonlyArray<ChoicePickerOption>;
  query: string;
  searchable: boolean;
  maxVisibleOptions?: number;
  pinnedOptionValues?: ReadonlyArray<string>;
}) {
  const normalizedQuery = normalizeSearchText(query);
  const pinnedValues = new Set(pinnedOptionValues);
  const pinnedOptions = options.filter((option) => pinnedValues.has(option.value));
  const regularOptions = options.filter((option) => !pinnedValues.has(option.value));
  const filteredRegularOptions = searchable && normalizedQuery
    ? regularOptions.filter((option) => optionSearchText(option).includes(normalizedQuery))
    : regularOptions;
  const filteredOptions = [...pinnedOptions, ...filteredRegularOptions];

  if (!maxVisibleOptions || filteredOptions.length <= maxVisibleOptions) {
    return { options: filteredOptions, hiddenCount: 0 };
  }

  return {
    options: filteredOptions.slice(0, maxVisibleOptions),
    hiddenCount: filteredOptions.length - maxVisibleOptions,
  };
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
  searchable = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Nenhuma opção encontrada.",
  maxVisibleOptions,
  pinnedOptionValues,
  moreResultsMessage = (hiddenCount) => `Mais ${hiddenCount} resultado${hiddenCount === 1 ? "" : "s"}. Continue digitando para filtrar.`,
  onValueChange,
  onOpenChange,
}: ChoicePickerFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const currentValue = value ?? internalValue;
  const open = isOpen ?? internalOpen;
  const currentLabel = optionLabel(options, currentValue);
  const visible = useMemo(
    () => visibleOptions({ options, query, searchable, maxVisibleOptions, pinnedOptionValues }),
    [maxVisibleOptions, options, pinnedOptionValues, query, searchable],
  );

  const updateOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setQuery("");
      if (isOpen === undefined) setInternalOpen(nextOpen);
      onOpenChange?.(nextOpen);
    },
    [isOpen, onOpenChange],
  );

  useEffect(() => {
    if (!open) return;

    if (searchable) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }

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
  }, [open, searchable, updateOpen]);

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
            surface === "warm" && styles.popoverWarm,
            popoverWidth === "compact" && styles.popoverCompact,
            popoverWidth === "control" && styles.popoverControlWidth,
            popoverClassName,
          )}
        >
          {searchable ? (
            <div className={styles.choiceSearchShell}>
              <Search className={styles.choiceSearchIcon} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                placeholder={searchPlaceholder}
                autoComplete="off"
                className={cn(
                  styles.choiceSearchInput,
                  surface === "warm" && styles.choiceSearchInputWarm,
                )}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          ) : null}

          <div
            className={styles.choiceOptions}
            role="listbox"
            aria-labelledby={id}
          >
            {visible.options.length > 0 ? visible.options.map((option) => {
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
                  <span className={styles.choiceOptionLabel}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.choiceOptionDescription}>{option.description}</span>
                  ) : null}
                </button>
              );
            }) : (
              <p className={styles.choiceEmptyMessage}>{emptyMessage}</p>
            )}
          </div>

          {visible.hiddenCount > 0 ? (
            <p className={styles.choiceMoreMessage}>
              {moreResultsMessage(visible.hiddenCount)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
