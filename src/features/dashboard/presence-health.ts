import { formatPresenceRate, presenceTone, type PresenceTone } from "@/features/events/presence-display";

export const WEEKLY_PRESENCE_TONE_THRESHOLDS = {
  risk: 65,
  warn: 75,
} as const;

export const WEEKLY_PRESENCE_LABEL = "Presença da semana";
export const WEEKLY_PRESENCE_DETAIL = "Média dos encontros registrados nesta semana.";
export const NO_WEEKLY_PRESENCE_DETAIL = "Nenhum encontro registrado nesta semana.";

export type WeeklyPresenceSummaryItem = {
  label: typeof WEEKLY_PRESENCE_LABEL;
  value: string;
  detail: string;
  tone: PresenceTone;
};

export function weeklyPresenceTone(hasPresenceData: boolean, presenceRate: number): PresenceTone {
  return presenceTone(hasPresenceData, presenceRate, WEEKLY_PRESENCE_TONE_THRESHOLDS);
}

export function buildWeeklyPresenceSummaryItem(
  hasPresenceData: boolean,
  presenceRate: number,
): WeeklyPresenceSummaryItem {
  return {
    label: WEEKLY_PRESENCE_LABEL,
    value: formatPresenceRate(hasPresenceData, presenceRate),
    detail: hasPresenceData ? WEEKLY_PRESENCE_DETAIL : NO_WEEKLY_PRESENCE_DETAIL,
    tone: weeklyPresenceTone(hasPresenceData, presenceRate),
  };
}
