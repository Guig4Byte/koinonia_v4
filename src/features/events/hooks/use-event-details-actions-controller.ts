"use client";

import { useState } from "react";
import { parseBrasiliaDateTime } from "@/features/events/brasilia-date-time";
import {
  closeEventActionCopy,
  eventActionsAvailability,
} from "@/features/events/event-actions-view";
import type { EventActionStatus } from "@/features/events/event-actions-view";
import { useEventActionRequest } from "@/features/events/hooks/use-event-action-request";
import { useEventDateTimeDraft } from "@/features/events/hooks/use-event-date-time-draft";

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
  const [localLocationName, setLocalLocationName] = useState(locationName ?? defaultLocationName ?? "");
  const dateTimeDraft = useEventDateTimeDraft(startsAt);
  const request = useEventActionRequest(eventId);

  const { canReschedule, isClosedWithoutPresence } = eventActionsAvailability(status, hasPresenceData);

  function readRequiredLocation(locationNameValue = localLocationName) {
    const nextLocationName = locationNameValue.trim();

    if (!nextLocationName) {
      request.showValidationError("O local do encontro precisa estar preenchido para salvar.");
      return null;
    }

    return nextLocationName;
  }

  function saveLocation(nextLocationNameValue?: string) {
    const nextLocationName = readRequiredLocation(nextLocationNameValue);
    if (!nextLocationName) return;

    setLocalLocationName(nextLocationName);
    request.runPatch({ locationName: nextLocationName }, "Local do encontro atualizado.");
  }

  function rescheduleMeeting() {
    const nextLocationName = readRequiredLocation();
    if (!nextLocationName) return;

    const nextStartsAt = parseBrasiliaDateTime(dateTimeDraft.localDate, dateTimeDraft.localTime);
    if (!nextStartsAt) {
      request.showValidationError("A data e o horário precisam estar válidos no horário de Brasília.");
      return;
    }

    request.runPatch(
      { startsAt: nextStartsAt, locationName: nextLocationName },
      "Encontro remarcado.",
    );
  }

  function markAsCancelled() {
    const copy = closeEventActionCopy(isFutureEvent);
    const confirmed = window.confirm(copy.confirmationMessage);
    if (!confirmed) return;

    request.runPatch({ status: copy.status }, copy.successMessage);
  }

  function reopenMeeting() {
    request.runPatch({ status: "SCHEDULED" }, "Encontro reaberto.");
  }

  return {
    calendarMonth: dateTimeDraft.calendarMonth,
    canReschedule,
    errorMessage: request.errorMessage,
    isClosedWithoutPresence,
    isPending: request.isPending,
    localDate: dateTimeDraft.localDate,
    localLocationName,
    localTime: dateTimeDraft.localTime,
    message: request.message,
    openPicker: dateTimeDraft.openPicker,
    selectedDateParts: dateTimeDraft.selectedDateParts,
    markAsCancelled,
    reopenMeeting,
    rescheduleMeeting,
    saveLocation,
    selectCalendarDay: dateTimeDraft.selectCalendarDay,
    selectTime: dateTimeDraft.selectTime,
    setCalendarMonth: dateTimeDraft.setCalendarMonth,
    setLocalLocationName,
    setLocalTime: dateTimeDraft.setLocalTime,
    setOpenPicker: dateTimeDraft.setOpenPicker,
    updateLocalDate: dateTimeDraft.updateLocalDate,
  };
}
