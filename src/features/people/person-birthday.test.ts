import { describe, expect, it } from "vitest";
import {
  formatPersonBirthday,
  formatPersonBirthdayDraftInput,
  parsePersonBirthdayPayload,
  personBirthdayFeedbackMessage,
  personBirthdayInputValue,
  personBirthdayErrorMessage,
  validatePersonBirthdayValue,
} from "@/features/people/person-birthday";

describe("person birthday", () => {
  it("aceita data válida no formato brasileiro e preserva o valor do input", () => {
    expect(validatePersonBirthdayValue("14/05/1992")).toEqual({
      ok: true,
      birthDate: new Date("1992-05-14T00:00:00.000Z"),
      inputValue: "14/05/1992",
    });
  });

  it("formata a digitação usando dd/mm/aaaa", () => {
    expect(formatPersonBirthdayDraftInput("14051992")).toBe("14/05/1992");
    expect(formatPersonBirthdayDraftInput("14/05/1992")).toBe("14/05/1992");
  });

  it("permite limpar a data opcional", () => {
    expect(validatePersonBirthdayValue("")).toEqual({
      ok: true,
      birthDate: null,
      inputValue: "",
    });
  });

  it("recusa datas inexistentes", () => {
    expect(validatePersonBirthdayValue("31/02/2026")).toEqual({
      ok: false,
      error: "aniversario-invalido",
    });
    expect(personBirthdayErrorMessage("aniversario-invalido")).toBe("Informe uma data válida no formato dd/mm/aaaa.");
  });

  it("formata o aniversário sem deslocar o dia pelo fuso local", () => {
    const value = new Date("1992-05-14T00:00:00.000Z");

    expect(personBirthdayInputValue(value)).toBe("14/05/1992");
    expect(formatPersonBirthday(value)).toBe("14 de maio");
  });

  it("mantém compatibilidade com valor ISO ao montar o campo", () => {
    expect(personBirthdayInputValue("1992-05-14")).toBe("14/05/1992");
    expect(validatePersonBirthdayValue("1992-05-14")).toEqual({
      ok: true,
      birthDate: new Date("1992-05-14T00:00:00.000Z"),
      inputValue: "14/05/1992",
    });
  });

  it("extrai a data do payload da API", () => {
    expect(parsePersonBirthdayPayload({ birthDate: "14/05/1992" })).toEqual({
      ok: true,
      birthDate: new Date("1992-05-14T00:00:00.000Z"),
      inputValue: "14/05/1992",
    });
  });

  it("mantém as mensagens de retorno da API", () => {
    expect(personBirthdayFeedbackMessage(new Date("1992-05-14T00:00:00.000Z"))).toBe(
      "Aniversário salvo no perfil da pessoa.",
    );
    expect(personBirthdayFeedbackMessage(null)).toBe("Aniversário removido do perfil da pessoa.");
  });
});
