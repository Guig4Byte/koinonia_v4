import { describe, expect, it } from "vitest";
import {
  buildWeeklyPresenceSummaryItem,
  NO_WEEKLY_PRESENCE_DETAIL,
  weeklyPresenceTone,
  WEEKLY_PRESENCE_DETAIL,
  WEEKLY_PRESENCE_LABEL,
  WEEKLY_PRESENCE_TONE_THRESHOLDS,
} from "./presence-health";

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

  it("monta o item padronizado de presença semanal sem dado", () => {
    expect(buildWeeklyPresenceSummaryItem(false, 0)).toEqual({
      label: WEEKLY_PRESENCE_LABEL,
      value: "—",
      detail: NO_WEEKLY_PRESENCE_DETAIL,
      tone: "neutral",
    });
  });

  it("monta o item padronizado de presença semanal registrada", () => {
    expect(buildWeeklyPresenceSummaryItem(true, 72)).toEqual({
      label: WEEKLY_PRESENCE_LABEL,
      value: "72%",
      detail: WEEKLY_PRESENCE_DETAIL,
      tone: "warn",
    });
  });
});
