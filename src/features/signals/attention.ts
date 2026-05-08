import { SignalSeverity } from "../../generated/prisma/client";
import { isPastoralEscalation, type SignalAssigneeLike } from "./escalation";
import { compareSignalsBySeverityAndRecency } from "./ranking";

export type AttentionSignalLike = {
  personId: string;
  severity: SignalSeverity;
  detectedAt: Date;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export function compareAttentionSignals(left: AttentionSignalLike, right: AttentionSignalLike) {
  return compareSignalsBySeverityAndRecency(left, right);
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
  const pastoralSignals = signals.filter((signal) => isPastoralSignal(signal));
  return getPrimarySignalsByPerson<T>(pastoralSignals);
}
