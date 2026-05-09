import { describe, expect, it } from "vitest";

import {
  DAYS_PER_WEEK,
  isValidWeekday,
  MAX_WEEKDAY,
  MIN_WEEKDAY,
  WEEKDAY_OPTIONS,
  weekdayLabel,
} from "@/features/groups/weekdays";

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

  it("valida o intervalo oficial de dias da semana", () => {
    expect(MIN_WEEKDAY).toBe(0);
    expect(MAX_WEEKDAY).toBe(6);
    expect(DAYS_PER_WEEK).toBe(7);
    expect(isValidWeekday(0)).toBe(true);
    expect(isValidWeekday(6)).toBe(true);
    expect(isValidWeekday(-1)).toBe(false);
    expect(isValidWeekday(7)).toBe(false);
    expect(isValidWeekday(null)).toBe(false);
  });

  it("retorna fallback para dia ausente ou inválido", () => {
    expect(weekdayLabel(null)).toBe("Dia informado");
    expect(weekdayLabel(undefined, "Sem dia fixo")).toBe("Sem dia fixo");
    expect(weekdayLabel(9)).toBe("Dia informado");
  });
});
