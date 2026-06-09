import type { PresenceIndicatorContext, PresenceTrend } from "./presence-metric.types";

export function clampPresenceRate(presenceRate: number): number {
  if (!Number.isFinite(presenceRate)) return 0;
  return Math.min(100, Math.max(0, Math.round(presenceRate)));
}

export function presenceMetricLabel(
  context: PresenceIndicatorContext,
  hasPresenceData: boolean,
  presenceRate: number,
): string {
  const subject = {
    person: "da pessoa",
    cell: "da célula",
    event: "do encontro",
    attendance: "do encontro",
    overview: "geral",
  }[context];

  return hasPresenceData
    ? `Presença ${subject}: ${clampPresenceRate(presenceRate)}%`
    : `Presença ${subject}: sem registro`;
}

export function presenceTrendValueLabel(delta: number): string {
  return `${delta} ${delta === 1 ? "ponto" : "pontos"}`;
}

export function presenceTrendLabel(trend: PresenceTrend, capitalized = false): string {
  const direction = trend.direction === "up"
    ? capitalized ? "Subiu" : "subiu"
    : capitalized ? "Caiu" : "caiu";

  return `${direction} ${presenceTrendValueLabel(trend.delta)} em relação ao período anterior`;
}
