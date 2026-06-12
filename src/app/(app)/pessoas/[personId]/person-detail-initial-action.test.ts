import { describe, expect, it } from "vitest";
import { resolvePersonDetailInitialAction } from "./person-detail-initial-action";

describe("resolvePersonDetailInitialAction", () => {
  it("reconhece as ações iniciais do perfil da pessoa", () => {
    expect(resolvePersonDetailInitialAction("telefone")).toBe("telefone");
    expect(resolvePersonDetailInitialAction("nome")).toBe("nome");
    expect(resolvePersonDetailInitialAction("aniversario")).toBe("aniversario");
  });

  it("usa o primeiro valor quando o parâmetro vem repetido", () => {
    expect(resolvePersonDetailInitialAction(["telefone", "nome"])).toBe("telefone");
  });

  it("ignora ações desconhecidas ou ausentes", () => {
    expect(resolvePersonDetailInitialAction("outra")).toBeNull();
    expect(resolvePersonDetailInitialAction(undefined)).toBeNull();
  });
});
