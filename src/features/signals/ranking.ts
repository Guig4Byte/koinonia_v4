import { SignalSeverity } from "@/generated/prisma/client";

export type SignalSeverityLike = SignalSeverity | string;

const signalSeverityRanks: Record<string, number> = {
  [SignalSeverity.URGENT]: 3,
  [SignalSeverity.ATTENTION]: 2,
  [SignalSeverity.INFO]: 1,
};

export type SignalPriorityLike = {
  severity: SignalSeverityLike;
  detectedAt?: Date | null;
};

export function signalSeverityRank(severity: SignalSeverityLike): number {
  return signalSeverityRanks[severity] ?? 0;
}

export function compareSignalsBySeverityAndRecency(left: SignalPriorityLike, right: SignalPriorityLike): number {
  const severityDifference = signalSeverityRank(right.severity) - signalSeverityRank(left.severity);
  if (severityDifference !== 0) return severityDifference;

  const leftTime = left.detectedAt?.getTime() ?? 0;
  const rightTime = right.detectedAt?.getTime() ?? 0;
  return rightTime - leftTime;
}
