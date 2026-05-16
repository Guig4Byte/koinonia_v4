import { describe, expect, it } from "vitest";
import {
  buildWeeklyPresenceSummaryItem,
  NO_WEEKLY_PRESENCE_DETAIL,
  weeklyPresenceDetail,
  weeklyPresenceTone,
  WEEKLY_PRESENCE_DETAIL,
  WEEKLY_PRESENCE_LABEL,
  WEEKLY_PRESENCE_TONE_THRESHOLDS,
  WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL,
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

  it("descreve corretamente o estado sem encontro registrado", () => {
    expect(weeklyPresenceDetail({ hasPresenceData: false, recordedEventsCount: 0 })).toBe(NO_WEEKLY_PRESENCE_DETAIL);
  });

  it("distingue encontro registrado sem presença de membros", () => {
    expect(weeklyPresenceDetail({ hasPresenceData: false, recordedEventsCount: 1 })).toBe(WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL);
  });

  it("monta o item padronizado de presença semanal sem dado", () => {
    expect(buildWeeklyPresenceSummaryItem({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 0 })).toEqual({
      label: WEEKLY_PRESENCE_LABEL,
      value: "—",
      detail: NO_WEEKLY_PRESENCE_DETAIL,
      tone: "neutral",
    });
  });

  it("monta o item padronizado de presença semanal registrada", () => {
    expect(buildWeeklyPresenceSummaryItem({ hasPresenceData: true, presenceRate: 72, recordedEventsCount: 2 })).toEqual({
      label: WEEKLY_PRESENCE_LABEL,
      value: "72%",
      detail: WEEKLY_PRESENCE_DETAIL,
      tone: "warn",
    });
  });
});
