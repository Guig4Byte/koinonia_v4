import { describe, expect, it } from "vitest";
import { CareKind } from "@/generated/prisma/client";
import { parseCarePayload, resolvedAttentionMessage } from "./care-validation";
import { CARE_NOTE_MAX_LENGTH } from "./care-note";

describe("care validation", () => {
  it("trims empty notes to undefined and defaults signal resolution", () => {
    const result = parseCarePayload({ kind: CareKind.CALL, note: "   " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.kind).toBe(CareKind.CALL);
    expect(result.data.note).toBeUndefined();
    expect(result.data.resolveOpenSignals).toBe(true);
  });

  it("rejects notes longer than the configured limit", () => {
    const result = parseCarePayload({ kind: CareKind.WHATSAPP, note: "a".repeat(CARE_NOTE_MAX_LENGTH + 1) });

    expect(result.success).toBe(false);
  });

  it("formats resolved attention feedback", () => {
    expect(resolvedAttentionMessage(0)).toBe("Nenhum motivo de atenção foi alterado.");
    expect(resolvedAttentionMessage(1)).toBe("1 motivo de atenção foi cuidado.");
    expect(resolvedAttentionMessage(2)).toBe("2 motivos de atenção foram cuidados.");
    expect(resolvedAttentionMessage(0, true)).toBe("Cuidado registrado. O irmão segue em cuidado.");
    expect(resolvedAttentionMessage(1, true)).toBe("1 motivo de atenção foi cuidado. O irmão segue em cuidado.");
  });
});
