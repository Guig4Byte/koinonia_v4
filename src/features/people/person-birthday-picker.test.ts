import { describe, expect, it } from "vitest";
import {
  birthdayDayLimit,
  birthdayDayOptions,
  birthdayDraftFromInput,
  birthdayInputFromPickerDraft,
  decadeStartFromYear,
  nextDecadeStart,
  updateBirthdayPickerDraft,
  yearsForDecade,
} from "@/features/people/person-birthday-picker";

describe("person birthday picker", () => {
  it("limita os dias conforme o mês e ano selecionados", () => {
    expect(birthdayDayLimit()).toBe(31);
    expect(birthdayDayLimit("04", "2026")).toBe(30);
    expect(birthdayDayLimit("02", "2026")).toBe(28);
    expect(birthdayDayLimit("02", "2024")).toBe(29);
    expect(birthdayDayLimit("02", "20")).toBe(29);
  });

  it("gera as opções de dia até o limite do mês", () => {
    expect(birthdayDayOptions("02", "2026")).toHaveLength(28);
    expect(birthdayDayOptions("02", "2026").at(-1)).toBe("28");
    expect(birthdayDayOptions("04", "2026").at(-1)).toBe("30");
  });

  it("converte entre o input manual e o rascunho do seletor", () => {
    expect(birthdayDraftFromInput("14051992")).toEqual({ day: "14", month: "05", year: "1992" });
    expect(birthdayDraftFromInput("14/05/1992")).toEqual({ day: "14", month: "05", year: "1992" });
    expect(birthdayInputFromPickerDraft({ day: "14", month: "05", year: "1992" })).toBe("14/05/1992");
    expect(birthdayInputFromPickerDraft({ day: "14", month: "05", year: "" })).toBe("");
  });

  it("resolve a década inicial usando o ano selecionado ou fallback de 30 anos", () => {
    expect(decadeStartFromYear("1992", 2026)).toBe(1990);
    expect(decadeStartFromYear("1899", 2026)).toBe(1990);
    expect(decadeStartFromYear("2030", 2026)).toBe(1990);
    expect(decadeStartFromYear("", 2026)).toBe(1990);
  });

  it("lista anos da década sem ultrapassar limites", () => {
    expect(yearsForDecade(1890, 2026)).toEqual([]);
    expect(yearsForDecade(1900, 2026)).toEqual(["1900", "1901", "1902", "1903", "1904", "1905", "1906", "1907", "1908", "1909"]);
    expect(yearsForDecade(2020, 2026)).toEqual(["2020", "2021", "2022", "2023", "2024", "2025", "2026"]);
  });

  it("navega décadas respeitando o ano mínimo e o ano atual", () => {
    expect(nextDecadeStart(1990, "previous", 2026)).toBe(1980);
    expect(nextDecadeStart(1900, "previous", 2026)).toBe(1900);
    expect(nextDecadeStart(2020, "next", 2026)).toBe(2020);
  });

  it("sanitiza o valor selecionado e limpa o dia quando ele deixa de existir no mês", () => {
    expect(updateBirthdayPickerDraft({ day: "", month: "", year: "" }, "day", "1a4")).toEqual({
      day: "14",
      month: "",
      year: "",
    });
    expect(updateBirthdayPickerDraft({ day: "31", month: "03", year: "2026" }, "month", "04")).toEqual({
      day: "",
      month: "04",
      year: "2026",
    });
    expect(updateBirthdayPickerDraft({ day: "29", month: "02", year: "2024" }, "year", "2026")).toEqual({
      day: "",
      month: "02",
      year: "2026",
    });
  });
});
