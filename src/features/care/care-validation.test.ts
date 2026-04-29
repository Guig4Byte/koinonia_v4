import { describe, expect, it } from "vitest";
import { CareKind } from "../../generated/prisma/client";
import { parseCarePayload, resolvedAttentionMessage } from "./care-validation";

describe("care validation", () => {
  it("trims empty notes to undefined and defaults signal resolution", () => {
    const result = parseCarePayload({ kind: CareKind.CALL, note: "   " });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.note).toBeUndefined();
    expect(result.data.resolveOpenSignals).toBe(true);
  });

  it("rejects notes longer than 500 characters", () => {
    const result = parseCarePayload({ kind: CareKind.WHATSAPP, note: "a".repeat(501) });

    expect(result.success).toBe(false);
  });

  it("formats resolved attention feedback", () => {
    expect(resolvedAttentionMessage(0)).toBe("Nenhum motivo de atenção foi alterado.");
    expect(resolvedAttentionMessage(1)).toBe("1 motivo de atenção foi resolvido.");
    expect(resolvedAttentionMessage(2)).toBe("2 motivos de atenção foram resolvidos.");
    expect(resolvedAttentionMessage(0, true)).toBe("Cuidado registrado. Pessoa ficou em cuidado.");
    expect(resolvedAttentionMessage(1, true)).toBe("1 motivo de atenção foi resolvido. Pessoa ficou em cuidado.");
  });
});
