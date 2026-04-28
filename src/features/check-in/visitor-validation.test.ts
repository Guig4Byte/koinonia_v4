import { describe, expect, it } from "vitest";
import { normalizeVisitorName, validateNewVisitors } from "./visitor-validation";

describe("visitor validation", () => {
  it("normalizes accents, casing and spacing", () => {
    expect(normalizeVisitorName("  João   Ávila ")).toBe("joao avila");
  });

  it("rejects a visitor already registered in the same event", () => {
    expect(validateNewVisitors([{ fullName: "João Ávila" }], [{ fullName: "joao avila" }])).toEqual({
      ok: false,
      error: "joao avila já está registrado como visitante neste encontro.",
    });
  });

  it("rejects duplicate visitors submitted together", () => {
    expect(validateNewVisitors([], [{ fullName: "Maria Souza" }, { fullName: "maria  souza" }])).toEqual({
      ok: false,
      error: "maria  souza já está registrado como visitante neste encontro.",
    });
  });
});
