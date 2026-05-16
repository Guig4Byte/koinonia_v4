import { formatPresenceRate, presenceTone, type PresenceTone } from "@/features/events/presence-display";

export const WEEKLY_PRESENCE_TONE_THRESHOLDS = {
  risk: 65,
  warn: 75,
} as const;

export const WEEKLY_PRESENCE_LABEL = "Presença da semana";
export const WEEKLY_PRESENCE_DETAIL = "Média dos encontros registrados nesta semana.";
export const NO_WEEKLY_PRESENCE_DETAIL = "Nenhum encontro registrado nesta semana.";
export const WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL = "Encontro registrado sem presença de membros.";

export type WeeklyPresenceSummary = {
  hasPresenceData: boolean;
  presenceRate: number;
  recordedEventsCount: number;
};

export type WeeklyPresenceSummaryItem = {
  label: typeof WEEKLY_PRESENCE_LABEL;
  value: string;
  detail: string;
  tone: PresenceTone;
};

export function weeklyPresenceTone(hasPresenceData: boolean, presenceRate: number): PresenceTone {
  return presenceTone(hasPresenceData, presenceRate, WEEKLY_PRESENCE_TONE_THRESHOLDS);
}

export function weeklyPresenceDetail(summary: Pick<WeeklyPresenceSummary, "hasPresenceData" | "recordedEventsCount">) {
  if (summary.hasPresenceData) return WEEKLY_PRESENCE_DETAIL;
  if (summary.recordedEventsCount > 0) return WEEKLY_PRESENCE_WITHOUT_MEMBER_DETAIL;

  return NO_WEEKLY_PRESENCE_DETAIL;
}

export function buildWeeklyPresenceSummaryItem(
  summary: WeeklyPresenceSummary,
): WeeklyPresenceSummaryItem {
  return {
    label: WEEKLY_PRESENCE_LABEL,
    value: formatPresenceRate(summary.hasPresenceData, summary.presenceRate),
    detail: weeklyPresenceDetail(summary),
    tone: weeklyPresenceTone(summary.hasPresenceData, summary.presenceRate),
  };
}
