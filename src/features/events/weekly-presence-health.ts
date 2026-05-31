import { presenceTone, type PresenceTone } from "@/features/events/presence-display";
import { PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT, PRESENCE_TREND_MIN_DELTA, type PresenceSummary } from "@/features/events/presence-summary";

export const WEEKLY_PRESENCE_TONE_THRESHOLDS = {
  risk: 65,
  warn: 75,
} as const;

export const WEEKLY_PRESENCE_LABEL = "Presença da semana";
export const WEEKLY_PRESENCE_DETAIL = "Média dos encontros registrados nesta semana.";
export const NO_WEEKLY_PRESENCE_DETAIL = "Ainda sem encontro registrado nesta semana.";
export const WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL = "Encontro salvo sem presença de membros.";
export const WEEKLY_PRESENCE_WITHOUT_TREND_DETAIL = "Ainda não há base suficiente para comparar com o último mês.";

export type WeeklyPresenceTrendDirection = "up" | "down" | "stable";

export type WeeklyPresenceTrend = {
  direction: WeeklyPresenceTrendDirection;
  delta: number;
  currentRate: number;
  previousRate: number;
};

export type WeeklyPresenceTrendPoint = {
  label: string;
  presenceRate: number;
  hasPresenceData: boolean;
};

export type WeeklyPresenceSummary = {
  hasPresenceData: boolean;
  presenceRate: number;
  recordedEventsCount: number;
  monthTrend?: WeeklyPresenceTrend | null;
  trendPoints?: WeeklyPresenceTrendPoint[];
};

export function weeklyPresenceTone(hasPresenceData: boolean, presenceRate: number): PresenceTone {
  return presenceTone(hasPresenceData, presenceRate, WEEKLY_PRESENCE_TONE_THRESHOLDS);
}

export function weeklyPresenceDetail(summary: Pick<WeeklyPresenceSummary, "hasPresenceData" | "recordedEventsCount">) {
  if (summary.hasPresenceData) return WEEKLY_PRESENCE_DETAIL;
  if (summary.recordedEventsCount > 0) return WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL;

  return NO_WEEKLY_PRESENCE_DETAIL;
}

export function buildWeeklyPresenceMonthTrend({
  current,
  previous,
}: {
  current: PresenceSummary;
  previous: PresenceSummary;
}): WeeklyPresenceTrend | null {
  if (current.accountableCount < PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT || previous.accountableCount < PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT) {
    return null;
  }

  const delta = current.presenceRate - previous.presenceRate;
  const absoluteDelta = Math.abs(delta);

  if (absoluteDelta < PRESENCE_TREND_MIN_DELTA) {
    return {
      direction: "stable",
      delta: 0,
      currentRate: current.presenceRate,
      previousRate: previous.presenceRate,
    };
  }

  return {
    direction: delta > 0 ? "up" : "down",
    delta: absoluteDelta,
    currentRate: current.presenceRate,
    previousRate: previous.presenceRate,
  };
}

export function weeklyPresenceTrendLabel(trend: WeeklyPresenceTrend | null | undefined) {
  if (!trend) return null;
  if (trend.direction === "stable") return "Sem mudança relevante em relação ao último mês";

  const direction = trend.direction === "up" ? "+" : "-";
  return `${direction}${trend.delta} pts em relação ao último mês`;
}

export function weeklyPresenceTrendInsight({
  hasPresenceData,
  recordedEventsCount,
  monthTrend,
}: Pick<WeeklyPresenceSummary, "hasPresenceData" | "recordedEventsCount" | "monthTrend">) {
  if (!hasPresenceData) {
    return recordedEventsCount > 0
      ? "Há presença registrada, mas sem base de membros para leitura."
      : "Ainda não há presença registrada nesta semana.";
  }

  if (!monthTrend) return WEEKLY_PRESENCE_WITHOUT_TREND_DETAIL;
  if (monthTrend.direction === "up") return "A presença melhorou nas últimas semanas.";
  if (monthTrend.direction === "down") return "A presença caiu em relação ao último mês.";

  return "A presença se manteve próxima da média do último mês.";
}
