import { describe, expect, it } from "vitest";

import { WEEKDAY_OPTIONS, weekdayLabel } from "@/features/groups/weekdays";

describe("weekdays", () => {
  it("mantém os rótulos oficiais da semana", () => {
    expect(WEEKDAY_OPTIONS).toEqual([
      { value: 0, label: "Domingo" },
      { value: 1, label: "Segunda" },
      { value: 2, label: "Terça" },
      { value: 3, label: "Quarta" },
      { value: 4, label: "Quinta" },
      { value: 5, label: "Sexta" },
      { value: 6, label: "Sábado" },
    ]);
  });

  it("retorna fallback para dia ausente ou inválido", () => {
    expect(weekdayLabel(null)).toBe("Dia informado");
    expect(weekdayLabel(undefined, "Sem dia fixo")).toBe("Sem dia fixo");
    expect(weekdayLabel(9)).toBe("Dia informado");
  });
});
