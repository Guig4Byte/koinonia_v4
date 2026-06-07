import type { CalendarMonth } from "@/features/events/brasilia-date-time";
import { parseBrasiliaDateValue } from "@/features/events/brasilia-date-time";
import { isClosedWithoutPresenceStatus } from "@/features/events/event-status";

export type EventActionStatus = "SCHEDULED" | "CHECKIN_OPEN" | "COMPLETED" | "CANCELLED" | "NO_MEETING";
export type EventCloseStatus = "SCHEDULED" | "CANCELLED" | "NO_MEETING";
export type OpenEventPicker = "date" | "time" | null;

export type EventPatchPayload = {
  locationName?: string;
  startsAt?: string;
  status?: EventCloseStatus;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function eventActionResponseError(payload: unknown) {
  if (isPlainRecord(payload) && typeof payload.error === "string") return payload.error;
  return "Não foi possível salvar o encontro.";
}

export function initialEventCalendarMonth(dateValue: string, fallbackDate = new Date()): CalendarMonth {
  const initialDateParts = parseBrasiliaDateValue(dateValue);

  return {
    year: initialDateParts?.year ?? fallbackDate.getFullYear(),
    monthIndex: initialDateParts ? initialDateParts.month - 1 : fallbackDate.getMonth(),
  };
}

export function eventLocationActionLabel(hasPresenceData: boolean) {
  return hasPresenceData ? "Ajustar local" : "Salvar local";
}

export function eventActionsAvailability(status: EventActionStatus, hasPresenceData: boolean) {
  const isClosedWithoutPresence = isClosedWithoutPresenceStatus(status);

  return {
    isClosedWithoutPresence,
    canReschedule: !hasPresenceData && !isClosedWithoutPresence,
  };
}

export function closeEventActionCopy(isFutureEvent: boolean) {
  if (isFutureEvent) {
    return {
      title: "Este encontro vai acontecer?",
      description: "Essa opção ajuda quando a célula já sabe que não vai se reunir nesta data.",
      actionLabel: "Cancelar encontro",
      confirmationMessage: "Cancelar este encontro? Essa opção ajuda quando a célula já sabe que não vai se reunir nesta data.",
      status: "CANCELLED" as const,
      successMessage: "Encontro cancelado.",
    };
  }

  return {
    title: "Aconteceu nesta semana?",
    description: "Essa opção registra que a célula não se reuniu e evita tratar o encontro como algo em aberto.",
    actionLabel: "Não houve encontro",
    confirmationMessage: "Marcar este encontro como não realizado? Essa opção registra que a célula não se reuniu nesta data.",
    status: "NO_MEETING" as const,
    successMessage: "Encontro marcado como não realizado.",
  };
}

export function closedWithoutPresenceCopy(isFutureEvent: boolean) {
  return isFutureEvent
    ? "Este encontro foi cancelado. Ele não aparece como presença aguardando registro."
    : "Este encontro foi marcado como não realizado. Ele não fica como presença aguardando registro.";
}
