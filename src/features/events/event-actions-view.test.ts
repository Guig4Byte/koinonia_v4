import { describe, expect, it } from "vitest";
import {
  closeEventActionCopy,
  closedWithoutPresenceCopy,
  eventActionResponseError,
  eventActionsAvailability,
  eventLocationActionLabel,
  initialEventCalendarMonth,
} from "./event-actions-view";

describe("event-actions-view", () => {
  it("returns the API error message when present", () => {
    expect(eventActionResponseError({ error: "Falha pastoral." })).toBe("Falha pastoral.");
    expect(eventActionResponseError({ message: "ok" })).toBe("Não foi possível salvar o encontro.");
  });

  it("calculates the initial calendar month from a Brasilia date", () => {
    expect(initialEventCalendarMonth("23/04/2026", new Date("2026-01-01T00:00:00Z"))).toEqual({
      year: 2026,
      monthIndex: 3,
    });
  });

  it("falls back to the provided date when the local date is invalid", () => {
    expect(initialEventCalendarMonth("invalid", new Date(2026, 1, 1))).toEqual({
      year: 2026,
      monthIndex: 1,
    });
  });

  it("keeps location copy contextual to presence data", () => {
    expect(eventLocationActionLabel(false)).toBe("Salvar local");
    expect(eventLocationActionLabel(true)).toBe("Ajustar local");
  });

  it("does not allow rescheduling closed or recorded meetings", () => {
    expect(eventActionsAvailability("SCHEDULED", false)).toEqual({
      isClosedWithoutPresence: false,
      canReschedule: true,
    });
    expect(eventActionsAvailability("CANCELLED", false)).toEqual({
      isClosedWithoutPresence: true,
      canReschedule: false,
    });
    expect(eventActionsAvailability("SCHEDULED", true)).toEqual({
      isClosedWithoutPresence: false,
      canReschedule: false,
    });
  });

  it("returns close action copy for future and past meetings", () => {
    expect(closeEventActionCopy(true)).toMatchObject({
      actionLabel: "Cancelar encontro",
      status: "CANCELLED",
      successMessage: "Encontro cancelado.",
    });
    expect(closeEventActionCopy(false)).toMatchObject({
      actionLabel: "Não houve encontro",
      status: "NO_MEETING",
      successMessage: "Encontro marcado como não realizado.",
    });
  });

  it("returns closed without presence helper text", () => {
    expect(closedWithoutPresenceCopy(true)).toContain("cancelado");
    expect(closedWithoutPresenceCopy(false)).toContain("não realizado");
  });
});
