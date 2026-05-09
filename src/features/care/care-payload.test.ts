import { describe, expect, it } from "vitest";
import { CareKind } from "@/generated/prisma/client";
import { normalizeCareKind } from "./care-payload";
import { CARE_NOTE_MAX_LENGTH, CARE_NOTE_TOO_LONG_MESSAGE, normalizeCareNote } from "./care-note";

describe("care-payload", () => {
  it("normaliza atalhos de contato para cuidado marcado", () => {
    expect(normalizeCareKind(CareKind.CALL)).toBe(CareKind.MARKED_CARED);
    expect(normalizeCareKind(CareKind.WHATSAPP)).toBe(CareKind.MARKED_CARED);
    expect(normalizeCareKind(CareKind.VISIT)).toBe(CareKind.MARKED_CARED);
    expect(normalizeCareKind(CareKind.PRAYER)).toBe(CareKind.MARKED_CARED);
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
