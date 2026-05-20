import { describe, expect, it } from "vitest";
import { CareKind } from "@/generated/prisma/client";
import { normalizeCareKind } from "./care-payload";
import { CARE_NOTE_MAX_LENGTH, CARE_NOTE_TOO_LONG_MESSAGE, normalizeCareNote } from "./care-note";

describe("care-payload", () => {
  it("preserva o tipo de cuidado recebido", () => {
    expect(normalizeCareKind(CareKind.CALL)).toBe(CareKind.CALL);
    expect(normalizeCareKind(CareKind.WHATSAPP)).toBe(CareKind.WHATSAPP);
    expect(normalizeCareKind(CareKind.VISIT)).toBe(CareKind.VISIT);
    expect(normalizeCareKind(CareKind.PRAYER)).toBe(CareKind.PRAYER);
    expect(normalizeCareKind(CareKind.MARKED_CARED)).toBe(CareKind.MARKED_CARED);
  });

  it("normaliza anotação vazia para ausência de anotação", () => {
    expect(normalizeCareNote("  contexto breve  ")).toBe("contexto breve");
    expect(normalizeCareNote("   ")).toBeUndefined();
    expect(normalizeCareNote(null)).toBeNull();
  });

  it("mantém limite e mensagem de anotação em uma fonte única", () => {
    expect(CARE_NOTE_MAX_LENGTH).toBe(500);
    expect(CARE_NOTE_TOO_LONG_MESSAGE).toBe("A anotação deve ter no máximo 500 caracteres.");
  });
});
