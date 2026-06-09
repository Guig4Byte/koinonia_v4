import { describe, expect, it } from "vitest";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS, formatPresenceRate, presenceTone } from "./presence-display";

describe("presence-display", () => {
  it("mantém thresholds padrão de presença em uma fonte nomeada", () => {
    expect(DEFAULT_PRESENCE_TONE_THRESHOLDS).toEqual({ risk: 50, warn: 70 });
  });

  it("formata percentual de presença e fallback sem dado", () => {
    expect(formatPresenceRate(true, 82)).toBe("82%");
    expect(formatPresenceRate(false, 0)).toBe("—");
    expect(formatPresenceRate(false, 0, "Sem registro")).toBe("Sem registro");
  });

  it("retorna tom neutro quando não há dado de presença", () => {
    expect(presenceTone(false, 0)).toBe("neutral");
  });

  it("classifica presença usando os thresholds padrão", () => {
    expect(presenceTone(true, 49)).toBe("risk");
    expect(presenceTone(true, 50)).toBe("warn");
    expect(presenceTone(true, 69)).toBe("warn");
    expect(presenceTone(true, 70)).toBe("ok");
  });

  it("aceita thresholds explícitos quando a superfície precisa de régua própria", () => {
    expect(presenceTone(true, 64, { risk: 65, warn: 75 })).toBe("risk");
    expect(presenceTone(true, 70, { risk: 65, warn: 75 })).toBe("warn");
    expect(presenceTone(true, 75, { risk: 65, warn: 75 })).toBe("ok");
  });
});
