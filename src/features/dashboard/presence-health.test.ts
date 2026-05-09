import { describe, expect, it } from "vitest";
import { weeklyPresenceTone, WEEKLY_PRESENCE_TONE_THRESHOLDS } from "./presence-health";

describe("presence-health", () => {
  it("mantém os thresholds semanais nomeados", () => {
    expect(WEEKLY_PRESENCE_TONE_THRESHOLDS).toEqual({ risk: 65, warn: 75 });
  });

  it("usa tom neutro quando não há dado de presença", () => {
    expect(weeklyPresenceTone(false, 0)).toBe("neutral");
  });

  it("classifica a presença semanal por thresholds pastorais", () => {
    expect(weeklyPresenceTone(true, 64)).toBe("risk");
    expect(weeklyPresenceTone(true, 65)).toBe("warn");
    expect(weeklyPresenceTone(true, 74)).toBe("warn");
    expect(weeklyPresenceTone(true, 75)).toBe("ok");
  });
});
