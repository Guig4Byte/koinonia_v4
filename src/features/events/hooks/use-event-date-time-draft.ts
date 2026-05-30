"use client";

import { useState } from "react";
import {
  formatBrasiliaDate,
  parseBrasiliaDateValue,
  toBrasiliaDateTimeParts,
} from "@/features/events/brasilia-date-time";
import type { CalendarMonth } from "@/features/events/brasilia-date-time";
import { initialEventCalendarMonth, type OpenEventPicker } from "@/features/events/event-actions-view";

export function useEventDateTimeDraft(startsAt: string) {
  const initialStartsAt = toBrasiliaDateTimeParts(startsAt);
  const [localDate, setLocalDate] = useState(initialStartsAt.date);
  const [localTime, setLocalTime] = useState(initialStartsAt.time);
  const [openPicker, setOpenPicker] = useState<OpenEventPicker>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => initialEventCalendarMonth(initialStartsAt.date));

  const selectedDateParts = parseBrasiliaDateValue(localDate);

  function updateLocalDate(value: string) {
    setLocalDate(value);

    const nextDateParts = parseBrasiliaDateValue(value);
    if (nextDateParts) {
      setCalendarMonth({ year: nextDateParts.year, monthIndex: nextDateParts.month - 1 });
    }
  }

  function selectCalendarDay(day: number) {
    const nextDate = formatBrasiliaDate({
      year: calendarMonth.year,
      month: calendarMonth.monthIndex + 1,
      day,
    });

    setLocalDate(nextDate);
    setOpenPicker(null);
  }

  function selectTime(time: string) {
    setLocalTime(time);
    setOpenPicker(null);
  }

  return {
    calendarMonth,
    localDate,
    localTime,
    openPicker,
    selectedDateParts,
    selectCalendarDay,
    selectTime,
    setCalendarMonth,
    setLocalTime,
    setOpenPicker,
    updateLocalDate,
  };
}
