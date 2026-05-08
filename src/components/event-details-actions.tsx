"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EventActionFeedback } from "@/components/event-action-feedback";
import { EventCloseAction } from "@/components/event-close-action";
import { EventLocationAction } from "@/components/event-location-action";
import { EventRescheduleAction } from "@/components/event-reschedule-action";
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
  eventLocationActionLabel,
  initialEventCalendarMonth,
} from "@/features/events/event-actions-view";
import type { EventActionStatus, EventPatchPayload, OpenEventPicker } from "@/features/events/event-actions-view";
import { timeOptionsWithCurrent } from "@/features/events/time-options";
import { readJsonResponse } from "@/lib/json";

export function EventDetailsActions({
  eventId,
  status,
  startsAt,
  locationName,
  defaultLocationName,
  hasPresenceData,
  isFutureEvent,
}: {
  eventId: string;
  status: EventActionStatus;
  startsAt: string;
  locationName?: string | null;
  defaultLocationName?: string | null;
  hasPresenceData: boolean;
  isFutureEvent: boolean;
}) {
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
  const timeOptions = timeOptionsWithCurrent(localTime);

  async function patchEvent(payload: EventPatchPayload, successMessage: string) {
    setMessage(null);
    setErrorMessage(null);

    const response = await fetch(`/api/events/${eventId}`, {
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

  return (
    <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <p className="font-semibold text-[var(--color-text-primary)]">Ajustes do encontro</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Ajuste só o que mudou nesta semana. Estas alterações valem apenas para este encontro.
      </p>

      <EventLocationAction
        value={localLocationName}
        defaultLocationName={defaultLocationName}
        actionLabel={eventLocationActionLabel(hasPresenceData)}
        disabled={isPending}
        onChange={setLocalLocationName}
        onSave={saveLocation}
      />

      {canReschedule ? (
        <EventRescheduleAction
          localDate={localDate}
          localTime={localTime}
          openPicker={openPicker}
          calendarMonth={calendarMonth}
          selectedDateParts={selectedDateParts}
          timeOptions={timeOptions}
          disabled={isPending}
          onDateChange={updateLocalDate}
          onTimeChange={setLocalTime}
          onOpenPickerChange={setOpenPicker}
          onCalendarMonthChange={setCalendarMonth}
          onCalendarDaySelect={selectCalendarDay}
          onTimeSelect={selectTime}
          onReschedule={rescheduleMeeting}
        />
      ) : null}

      <EventCloseAction
        hasPresenceData={hasPresenceData}
        isClosedWithoutPresence={isClosedWithoutPresence}
        isFutureEvent={isFutureEvent}
        disabled={isPending}
        onClose={markAsCancelled}
        onReopen={reopenMeeting}
      />

      <EventActionFeedback message={message} errorMessage={errorMessage} />
    </section>
  );
}
