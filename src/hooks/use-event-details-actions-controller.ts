"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  formatBrasiliaDate,
  parseBrasiliaDateTime,
  parseBrasiliaDateValue,
  toBrasiliaDateTimeParts,
} from "@/features/events/brasilia-date-time";
import type { CalendarMonth } from "@/features/events/brasilia-date-time";
import {
  closeEventActionCopy,
  eventActionResponseError,
  eventActionsAvailability,
  initialEventCalendarMonth,
} from "@/features/events/event-actions-view";
import type { EventActionStatus, EventPatchPayload, OpenEventPicker } from "@/features/events/event-actions-view";
import { API_ROUTES } from "@/lib/api-routes";
import { readJsonResponse } from "@/lib/json";

type UseEventDetailsActionsControllerOptions = {
  eventId: string;
  status: EventActionStatus;
  startsAt: string;
  locationName?: string | null;
  defaultLocationName?: string | null;
  hasPresenceData: boolean;
  isFutureEvent: boolean;
};

export function useEventDetailsActionsController({
  eventId,
  status,
  startsAt,
  locationName,
  defaultLocationName,
  hasPresenceData,
  isFutureEvent,
}: UseEventDetailsActionsControllerOptions) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localLocationName, setLocalLocationName] = useState(locationName ?? defaultLocationName ?? "");
  const initialStartsAt = toBrasiliaDateTimeParts(startsAt);
  const [localDate, setLocalDate] = useState(initialStartsAt.date);
  const [localTime, setLocalTime] = useState(initialStartsAt.time);
  const [openPicker, setOpenPicker] = useState<OpenEventPicker>(null);
  const [calendarMonth, setCalendarMonth] = useState<CalendarMonth>(() => initialEventCalendarMonth(initialStartsAt.date));
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { canReschedule, isClosedWithoutPresence } = eventActionsAvailability(status, hasPresenceData);
  const selectedDateParts = parseBrasiliaDateValue(localDate);

  async function patchEvent(payload: EventPatchPayload, successMessage: string) {
    setMessage(null);
    setErrorMessage(null);

    const response = await fetch(API_ROUTES.event(eventId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await readJsonResponse(response);

    if (!response.ok) {
      setErrorMessage(eventActionResponseError(body));
      return;
    }

    setMessage(successMessage);
    router.refresh();
  }

  function readRequiredLocation() {
    const nextLocationName = localLocationName.trim();

    if (!nextLocationName) {
      setMessage(null);
      setErrorMessage("Informe o local deste encontro antes de salvar.");
      return null;
    }

    return nextLocationName;
  }

  function saveLocation() {
    const nextLocationName = readRequiredLocation();
    if (!nextLocationName) return;

    startTransition(() => {
      void patchEvent({ locationName: nextLocationName }, "Local do encontro atualizado.");
    });
  }

  function rescheduleMeeting() {
    const nextLocationName = readRequiredLocation();
    if (!nextLocationName) return;

    const nextStartsAt = parseBrasiliaDateTime(localDate, localTime);
    if (!nextStartsAt) {
      setMessage(null);
      setErrorMessage("Informe uma data e horário válidos no horário de Brasília.");
      return;
    }

    startTransition(() => {
      void patchEvent(
        { startsAt: nextStartsAt, locationName: nextLocationName },
        "Encontro remarcado.",
      );
    });
  }

  function markAsCancelled() {
    const copy = closeEventActionCopy(isFutureEvent);
    const confirmed = window.confirm(copy.confirmationMessage);
    if (!confirmed) return;

    startTransition(() => {
      void patchEvent({ status: copy.status }, copy.successMessage);
    });
  }

  function reopenMeeting() {
    startTransition(() => {
      void patchEvent({ status: "SCHEDULED" }, "Encontro reaberto.");
    });
  }

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
    canReschedule,
    errorMessage,
    isClosedWithoutPresence,
    isPending,
    localDate,
    localLocationName,
    localTime,
    message,
    openPicker,
    selectedDateParts,
    markAsCancelled,
    reopenMeeting,
    rescheduleMeeting,
    saveLocation,
    selectCalendarDay,
    selectTime,
    setCalendarMonth,
    setLocalLocationName,
    setLocalTime,
    setOpenPicker,
    updateLocalDate,
  };
}
