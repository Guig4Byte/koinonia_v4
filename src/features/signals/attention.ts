import { SignalSeverity } from "../../generated/prisma/client";

export type AttentionSignalLike = {
  personId: string;
  severity: SignalSeverity;
  detectedAt: Date;
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
