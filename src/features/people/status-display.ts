import { PersonStatus } from "../../generated/prisma/client";
import { signalBadgeForViewer, type SignalDisplayLike, type SignalDisplayViewerLike } from "../signals/display";

export type PersonStatusTone = "neutral" | "ok" | "warn" | "risk" | "info" | "care";

export const personStatusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Ativo",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Em cuidado",
  INACTIVE: "Inativo",
};

export function personStatusTone(status: PersonStatus): PersonStatusTone {
  if (status === PersonStatus.ACTIVE) return "ok";
  if (status === PersonStatus.COOLING_AWAY) return "care";
  if (status === PersonStatus.VISITOR || status === PersonStatus.NEW) return "info";
  if (status === PersonStatus.INACTIVE) return "neutral";
  return "warn";
}

export function personStatusDisplay(status: PersonStatus) {
  return { label: personStatusLabels[status], tone: personStatusTone(status) };
}


export type PersonEffectiveBadgePersonLike = {
  status: PersonStatus;
};

export function personEffectiveBadgeForViewer(
  person: PersonEffectiveBadgePersonLike,
  primarySignal?: SignalDisplayLike | null,
  viewer?: SignalDisplayViewerLike | null,
) {
  if (primarySignal) {
    return signalBadgeForViewer(primarySignal, viewer);
  }

  return personStatusDisplay(person.status);
}
