import { PersonStatus } from "@/generated/prisma/client";
import { isActiveStatus, isInCareStatus } from "@/features/people/person-status";
import { signalBadgeForViewer, type SignalBadge, type SignalDisplayLike, type SignalDisplayViewerLike } from "../signals/display";

export type PersonStatusTone = "neutral" | "ok" | "warn" | "risk" | "info" | "care";

export type PersonStatusBadge = {
  label: string;
  tone: PersonStatusTone;
};

export const personStatusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Sem sinal aberto",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Em cuidado",
  INACTIVE: "Inativo",
};

export function personStatusTone(status: PersonStatus): PersonStatusTone {
  if (isActiveStatus(status)) return "ok";
  if (isInCareStatus(status)) return "care";
  if (status === PersonStatus.VISITOR || status === PersonStatus.NEW) return "info";
  if (status === PersonStatus.INACTIVE) return "neutral";
  return "warn";
}

export function personStatusDisplay(status: PersonStatus): PersonStatusBadge {
  return { label: personStatusLabels[status], tone: personStatusTone(status) };
}

export type PersonEffectiveBadgePersonLike = {
  status: PersonStatus;
};

/**
 * Resolve o badge principal de uma pessoa para um usuário específico.
 *
 * Prioriza o sinal aberto visível porque ele explica a atenção atual.
 * Sem sinal primário, cai no status persistido da pessoa.
 */
export function personEffectiveBadgeForViewer(
  person: PersonEffectiveBadgePersonLike,
  primarySignal?: SignalDisplayLike | null,
  viewer?: SignalDisplayViewerLike | null,
): SignalBadge | PersonStatusBadge {
  if (primarySignal) {
    return signalBadgeForViewer(primarySignal, viewer);
  }

  return personStatusDisplay(person.status);
}
