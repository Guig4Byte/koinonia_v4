export type PresenceTone = "ok" | "warn" | "risk" | "neutral";

export type PresenceToneThresholds = {
  risk: number;
  warn: number;
};

export const DEFAULT_PRESENCE_TONE_THRESHOLDS: PresenceToneThresholds = {
  risk: 50,
  warn: 70,
} as const;

export function formatPresenceRate(
  hasPresenceData: boolean,
  presenceRate: number,
  emptyLabel = "—",
): string {
  return hasPresenceData ? `${presenceRate}%` : emptyLabel;
}

export function presenceTone(
  hasPresenceData: boolean,
  presenceRate: number,
  thresholds: PresenceToneThresholds = DEFAULT_PRESENCE_TONE_THRESHOLDS,
): PresenceTone {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < thresholds.risk) return "risk";
  if (presenceRate < thresholds.warn) return "warn";
  return "ok";
}
