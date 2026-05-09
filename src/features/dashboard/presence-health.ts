import { presenceTone, type PresenceTone } from "@/features/events/presence-display";

export const WEEKLY_PRESENCE_TONE_THRESHOLDS = {
  risk: 65,
  warn: 75,
} as const;

export function weeklyPresenceTone(hasPresenceData: boolean, presenceRate: number): PresenceTone {
  return presenceTone(hasPresenceData, presenceRate, WEEKLY_PRESENCE_TONE_THRESHOLDS);
}
