export type PresenceTone = "ok" | "warn" | "risk" | "neutral";

export function presenceTone(
  hasPresenceData: boolean,
  presenceRate: number,
  thresholds = { risk: 50, warn: 70 },
): PresenceTone {
  if (!hasPresenceData) return "neutral";
  if (presenceRate < thresholds.risk) return "risk";
  if (presenceRate < thresholds.warn) return "warn";
  return "ok";
}
