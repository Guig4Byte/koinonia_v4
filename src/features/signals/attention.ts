import { SignalSeverity } from "../../generated/prisma/client";
import { isPastoralEscalation, type SignalAssigneeLike } from "./escalation";

export type AttentionSignalLike = {
  personId: string;
  severity: SignalSeverity;
  detectedAt: Date;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

const severityRank: Record<SignalSeverity, number> = {
  URGENT: 3,
  ATTENTION: 2,
  INFO: 1,
};

export function compareAttentionSignals(left: AttentionSignalLike, right: AttentionSignalLike) {
  const severityDifference = severityRank[right.severity] - severityRank[left.severity];
  if (severityDifference !== 0) return severityDifference;

  return right.detectedAt.getTime() - left.detectedAt.getTime();
}

export function isPastoralSignal(signal: AttentionSignalLike) {
  return isPastoralEscalation(signal);
}

export function getPrimarySignalsByPerson<T extends AttentionSignalLike>(signals: T[]) {
  const selectedByPerson = new Map<string, T>();

  for (const signal of signals) {
    const current = selectedByPerson.get(signal.personId);

    if (!current || compareAttentionSignals(signal, current) < 0) {
      selectedByPerson.set(signal.personId, signal);
    }
  }

  return Array.from(selectedByPerson.values()).sort(compareAttentionSignals);
}

export function getPastoralSignalsByPerson<T extends AttentionSignalLike>(signals: T[]) {
  return getPrimarySignalsByPerson(signals.filter(isPastoralSignal));
}
