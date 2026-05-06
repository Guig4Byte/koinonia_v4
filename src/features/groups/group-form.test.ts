import { describe, expect, it } from "vitest";
import { parseGroupFormFields } from "./group-form";

describe("group form validation", () => {
  it("accepts a basic active cell with a complete schedule", () => {
    expect(parseGroupFormFields({
      name: "Célula Central",
      meetingDayOfWeek: "3",
      meetingTime: "20:00",
      locationName: "Casa da Ana",
      isActive: "on",
    })).toEqual({
      ok: true,
      values: {
        name: "Célula Central",
        meetingDayOfWeek: 3,
        meetingTime: "20:00",
        locationName: "Casa da Ana",
        isActive: true,
      },
    });
  });

  it("allows a cell without a default schedule", () => {
    expect(parseGroupFormFields({ name: "Célula Norte", meetingDayOfWeek: "", meetingTime: "" })).toEqual({
      ok: true,
      values: {
        name: "Célula Norte",
        meetingDayOfWeek: null,
        meetingTime: null,
        locationName: null,
        isActive: false,
      },
    });
  });

  it("requires day and time to be filled together", () => {
    expect(parseGroupFormFields({ name: "Célula Sul", meetingDayOfWeek: "2", meetingTime: "" })).toEqual({
      ok: false,
      error: "agenda-incompleta",
    });

    expect(parseGroupFormFields({ name: "Célula Sul", meetingDayOfWeek: "", meetingTime: "19:30" })).toEqual({
      ok: false,
      error: "agenda-incompleta",
    });
  });

  it("rejects invalid schedule values", () => {
    expect(parseGroupFormFields({ name: "Célula Leste", meetingDayOfWeek: "8", meetingTime: "19:30" })).toEqual({
      ok: false,
      error: "dia-invalido",
    });

    expect(parseGroupFormFields({ name: "Célula Leste", meetingDayOfWeek: "4", meetingTime: "25:00" })).toEqual({
      ok: false,
      error: "horario-invalido",
    });
  });
});
