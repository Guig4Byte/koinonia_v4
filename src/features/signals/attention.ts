import { SignalSeverity } from "@/generated/prisma/client";
import { isPastoralEscalationSignal, type SignalAssigneeLike } from "./signal-classification";
import { compareSignalsBySeverityAndRecency } from "./ranking";
import { selectBestSignalByPerson } from "./signal-utils";

export type AttentionSignalLike = {
  personId: string;
  severity: SignalSeverity;
  detectedAt: Date;
  assignedToId?: string | null;
  assignedTo?: SignalAssigneeLike | null;
};

export function getPrimarySignalsByPerson<T extends AttentionSignalLike>(signals: T[]) {
  const selected = selectBestSignalByPerson(signals, compareSignalsBySeverityAndRecency);
  return selected.sort(compareSignalsBySeverityAndRecency);
}

export function getPastoralSignalsByPerson<T extends AttentionSignalLike>(signals: T[]) {
  const pastoralSignals = signals.filter((signal) => isPastoralEscalationSignal(signal));
  return getPrimarySignalsByPerson<T>(pastoralSignals);
}
