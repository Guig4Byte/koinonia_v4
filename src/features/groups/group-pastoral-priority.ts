import { SignalSeverity, UserRole } from "@/generated/prisma/client";
import { countLabel } from "@/lib/format";
import { NO_RECENT_PRESENCE_LABEL } from "@/lib/filter-param";

export const LOW_PRESENCE_THRESHOLD = 70;
export const NO_RECENT_PRESENCE_PRIORITY = 25;

export const GROUP_PRIORITY_WEIGHTS = {
  urgent: 1200,
  pastoralCase: 1000,
  supportRequest: 700,
  localAttention: 400,
  inCare: 200,
  lowPresenceBase: 100,
} as const;

export type GroupPastoralSignalLike = {
  severity?: SignalSeverity | string | null;
  assignedTo?: { role?: UserRole | string | null } | null;
};

export type GroupPastoralPriorityInput = {
  signals?: GroupPastoralSignalLike[];
  urgentCount?: number;
  pastoralCasesCount?: number;
  supportRequestsCount?: number;
  attentionCount?: number;
  localAttentionCount?: number;
  inCareCount?: number;
  hasPresenceData: boolean;
  presenceRate: number;
};

function countSignals(signals: GroupPastoralSignalLike[] | undefined, predicate: (signal: GroupPastoralSignalLike) => boolean) {
  return (signals ?? []).filter(predicate).length;
}

export function isPastoralAssignedSignal(signal: GroupPastoralSignalLike) {
  return signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN;
}

export function isSupervisorSupportSignal(signal: GroupPastoralSignalLike) {
  return signal.assignedTo?.role === UserRole.SUPERVISOR;
}

export function isUrgentSignal(signal: GroupPastoralSignalLike) {
  return signal.severity === SignalSeverity.URGENT;
}

export function hasLowPresence(group: Pick<GroupPastoralPriorityInput, "hasPresenceData" | "presenceRate">) {
  return group.hasPresenceData && group.presenceRate < LOW_PRESENCE_THRESHOLD;
}

export function groupUrgentCount(group: Pick<GroupPastoralPriorityInput, "signals" | "urgentCount">) {
  return group.urgentCount ?? countSignals(group.signals, isUrgentSignal);
}

export function groupPastoralCasesCount(group: Pick<GroupPastoralPriorityInput, "signals" | "pastoralCasesCount">) {
  return group.pastoralCasesCount ?? countSignals(group.signals, (signal) => isUrgentSignal(signal) || isPastoralAssignedSignal(signal));
}

export function groupPastoralEscalatedCount(group: Pick<GroupPastoralPriorityInput, "signals">) {
  return countSignals(group.signals, isPastoralAssignedSignal);
}

export function groupRiskCount(group: Pick<GroupPastoralPriorityInput, "signals" | "pastoralCasesCount">) {
  return groupPastoralCasesCount(group);
}

export function groupLocalAttentionCount(group: GroupPastoralPriorityInput) {
  if (group.localAttentionCount !== undefined) return group.localAttentionCount;

  const attentionCount = group.attentionCount ?? 0;
  const pastoralCasesCount = groupPastoralCasesCount(group);
  const supportRequestsCount = group.supportRequestsCount ?? countSignals(group.signals, isSupervisorSupportSignal);

  return Math.max(attentionCount - pastoralCasesCount - supportRequestsCount, 0);
}

export function groupNeedsPastoralAttention(group: GroupPastoralPriorityInput) {
  return groupPastoralCasesCount(group) > 0
    || (group.supportRequestsCount ?? countSignals(group.signals, isSupervisorSupportSignal)) > 0
    || groupLocalAttentionCount(group) > 0
    || hasLowPresence(group);
}

export function groupPastoralPriorityScore(group: GroupPastoralPriorityInput) {
  const urgent = groupUrgentCount(group);
  const pastoralEscalated = groupPastoralEscalatedCount(group);
  const supportRequests = group.supportRequestsCount ?? countSignals(group.signals, isSupervisorSupportSignal);
  const localAttention = groupLocalAttentionCount(group);
  const inCare = group.inCareCount ?? 0;
  const lowPresenceScore = hasLowPresence(group) ? LOW_PRESENCE_THRESHOLD - group.presenceRate : 0;
  const noPresenceScore = group.hasPresenceData ? 0 : NO_RECENT_PRESENCE_PRIORITY;

  return urgent * GROUP_PRIORITY_WEIGHTS.urgent
    + pastoralEscalated * GROUP_PRIORITY_WEIGHTS.pastoralCase
    + supportRequests * GROUP_PRIORITY_WEIGHTS.supportRequest
    + localAttention * GROUP_PRIORITY_WEIGHTS.localAttention
    + inCare * GROUP_PRIORITY_WEIGHTS.inCare
    + lowPresenceScore
    + noPresenceScore;
}

export function teamGroupPastoralPriorityScore(group: Pick<GroupPastoralPriorityInput, "urgentCount" | "pastoralCasesCount" | "hasPresenceData" | "presenceRate">) {
  const urgent = group.urgentCount ?? 0;
  const pastoralCases = group.pastoralCasesCount ?? 0;
  const lowPresenceScore = hasLowPresence(group) ? GROUP_PRIORITY_WEIGHTS.lowPresenceBase + (LOW_PRESENCE_THRESHOLD - group.presenceRate) : 0;

  return urgent * 1000
    + Math.max(pastoralCases - urgent, 0) * 700
    + lowPresenceScore;
}

export function teamGroupStatusLabel({
  urgentCount,
  pastoralCasesCount,
  hasNoPresenceData,
  hasLowPresence: lowPresence,
}: {
  urgentCount: number;
  pastoralCasesCount: number;
  hasNoPresenceData: boolean;
  hasLowPresence: boolean;
}) {
  if (urgentCount > 0) return countLabel(urgentCount, "urgente", "urgentes");
  if (pastoralCasesCount > 0) return countLabel(pastoralCasesCount, "caso pastoral", "casos pastorais");
  if (hasNoPresenceData) return NO_RECENT_PRESENCE_LABEL;
  if (lowPresence) return "Presença baixa";

  return "Estável";
}
