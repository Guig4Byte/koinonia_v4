import { AttendanceStatus } from "@/generated/prisma/client";
import { describe, expect, it } from "vitest";
import {
  buildWeeklyPresenceMonthTrend,
  NO_WEEKLY_PRESENCE_DETAIL,
  weeklyPresenceDetail,
  weeklyPresenceTone,
  weeklyPresenceTrendInsight,
  weeklyPresenceTrendLabel,
  WEEKLY_PRESENCE_TONE_THRESHOLDS,
  WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL,
} from "./presence-health";
import { summarizePresenceFromAttendances } from "@/features/events/presence-summary";

function presence(present: number, absent: number) {
  return summarizePresenceFromAttendances([
    ...Array.from({ length: present }, () => ({ status: AttendanceStatus.PRESENT })),
    ...Array.from({ length: absent }, () => ({ status: AttendanceStatus.ABSENT })),
  ]);
}

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

  it("monta tendência mensal da presença", () => {
    const upTrend = buildWeeklyPresenceMonthTrend({ current: presence(8, 2), previous: presence(6, 4) });
    const stableTrend = buildWeeklyPresenceMonthTrend({ current: presence(8, 2), previous: presence(8, 2) });
    const downTrend = buildWeeklyPresenceMonthTrend({ current: presence(5, 5), previous: presence(8, 2) });

    expect(upTrend).toEqual({ direction: "up", delta: 20, currentRate: 80, previousRate: 60 });
    expect(stableTrend).toEqual({ direction: "stable", delta: 0, currentRate: 80, previousRate: 80 });
    expect(downTrend).toEqual({ direction: "down", delta: 30, currentRate: 50, previousRate: 80 });
  });

  it("explica a tendência mensal da presença", () => {
    expect(weeklyPresenceTrendLabel({ direction: "up", delta: 5, currentRate: 79, previousRate: 74 })).toBe("+5 pts em relação ao último mês");
    expect(weeklyPresenceTrendLabel({ direction: "down", delta: 7, currentRate: 67, previousRate: 74 })).toBe("-7 pts em relação ao último mês");
    expect(weeklyPresenceTrendLabel({ direction: "stable", delta: 0, currentRate: 74, previousRate: 74 })).toBe("Sem mudança relevante em relação ao último mês");
    expect(weeklyPresenceTrendInsight({ hasPresenceData: true, recordedEventsCount: 2, monthTrend: { direction: "up", delta: 5, currentRate: 79, previousRate: 74 } })).toBe("A presença melhorou nas últimas semanas.");
  });
});
