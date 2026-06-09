import { describe, expect, it } from "vitest";
import {
  parsePersonPhonePayload,
  personPhoneErrorMessage,
  validatePersonPhoneValue,
} from "@/features/people/person-phone";

describe("person phone", () => {
  it("aceita telefone com DDD e mantém o formato informado", () => {
    expect(validatePersonPhoneValue(" (21) 99999-9999 ")).toEqual({
      ok: true,
      phone: "(21) 99999-9999",
    });
  });

  it("recusa telefone sem DDD", () => {
    expect(validatePersonPhoneValue("9999-9999")).toEqual({
      ok: false,
      error: "telefone-invalido",
    });
    expect(personPhoneErrorMessage("telefone-invalido")).toBe("Informe um telefone com DDD.");
  });

  it("extrai o telefone do payload da API", () => {
    expect(parsePersonPhonePayload({ phone: "+5521999999999" })).toEqual({
      ok: true,
      phone: "+5521999999999",
    });
  });
});
