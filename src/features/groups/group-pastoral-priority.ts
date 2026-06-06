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

export type GroupPastoralStatusKey =
  | "urgent"
  | "pastoralCase"
  | "supportRequest"
  | "localAttention"
  | "withoutRecentPresence"
  | "stable";

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
  recordedEventsCount?: number;
};

export type GroupPresenceHistoryInput = Pick<GroupPastoralPriorityInput, "hasPresenceData" | "recordedEventsCount">;

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

export function isPastoralCaseSignal(signal: GroupPastoralSignalLike) {
  return !isUrgentSignal(signal) && isPastoralAssignedSignal(signal);
}

export function hasLowPresence(group: Pick<GroupPastoralPriorityInput, "hasPresenceData" | "presenceRate">) {
  return group.hasPresenceData && group.presenceRate < LOW_PRESENCE_THRESHOLD;
}

export function hasPresenceHistory(group: GroupPresenceHistoryInput) {
  if (group.recordedEventsCount !== undefined) {
    return group.hasPresenceData || group.recordedEventsCount > 0;
  }

  return true;
}

export function hasNoRecentPresence(group: GroupPresenceHistoryInput) {
  return !group.hasPresenceData && hasPresenceHistory(group);
}

export function groupUrgentCount(group: Pick<GroupPastoralPriorityInput, "signals" | "urgentCount">) {
  return group.urgentCount ?? countSignals(group.signals, isUrgentSignal);
}

export function groupPastoralCasesCount(group: Pick<GroupPastoralPriorityInput, "signals" | "pastoralCasesCount">) {
  return group.pastoralCasesCount ?? countSignals(group.signals, isPastoralCaseSignal);
}

export function groupPastoralEscalatedCount(group: Pick<GroupPastoralPriorityInput, "signals" | "pastoralCasesCount">) {
  return groupPastoralCasesCount(group);
}

export function groupSupportRequestsCount(group: Pick<GroupPastoralPriorityInput, "signals" | "supportRequestsCount">) {
  return group.supportRequestsCount ?? countSignals(group.signals, isSupervisorSupportSignal);
}

export function groupRiskCount(group: Pick<GroupPastoralPriorityInput, "signals" | "urgentCount" | "pastoralCasesCount">) {
  return groupUrgentCount(group) + groupPastoralCasesCount(group);
}

export function groupLocalAttentionCount(group: GroupPastoralPriorityInput) {
  if (group.localAttentionCount !== undefined) return group.localAttentionCount;

  const attentionCount = group.attentionCount ?? 0;
  const riskCount = groupRiskCount(group);
  const supportRequestsCount = groupSupportRequestsCount(group);

  return Math.max(attentionCount - riskCount - supportRequestsCount, 0);
}

export function groupPastoralStatusKey(group: GroupPastoralPriorityInput): GroupPastoralStatusKey {
  if (groupUrgentCount(group) > 0) return "urgent";
  if (groupPastoralCasesCount(group) > 0) return "pastoralCase";
  if (groupSupportRequestsCount(group) > 0) return "supportRequest";
  if (groupLocalAttentionCount(group) > 0 || (group.inCareCount ?? 0) > 0 || hasLowPresence(group)) return "localAttention";
  if (hasNoRecentPresence(group)) return "withoutRecentPresence";

  return "stable";
}

export function groupNeedsPastoralAttention(group: GroupPastoralPriorityInput) {
  return groupRiskCount(group) > 0
    || groupSupportRequestsCount(group) > 0
    || groupLocalAttentionCount(group) > 0
    || hasLowPresence(group);
}

export function groupNeedsTeamAttention(group: GroupPastoralPriorityInput) {
  const statusKey = groupPastoralStatusKey(group);

  return statusKey !== "stable" && statusKey !== "withoutRecentPresence";
}

export function groupPastoralPriorityScore(group: GroupPastoralPriorityInput) {
  const urgent = groupUrgentCount(group);
  const pastoralCases = groupPastoralCasesCount(group);
  const supportRequests = groupSupportRequestsCount(group);
  const localAttention = groupLocalAttentionCount(group);
  const inCare = group.inCareCount ?? 0;
  const lowPresenceScore = hasLowPresence(group) ? LOW_PRESENCE_THRESHOLD - group.presenceRate : 0;
  const noPresenceScore = hasNoRecentPresence(group) ? NO_RECENT_PRESENCE_PRIORITY : 0;

  return urgent * GROUP_PRIORITY_WEIGHTS.urgent
    + pastoralCases * GROUP_PRIORITY_WEIGHTS.pastoralCase
    + supportRequests * GROUP_PRIORITY_WEIGHTS.supportRequest
    + localAttention * GROUP_PRIORITY_WEIGHTS.localAttention
    + inCare * GROUP_PRIORITY_WEIGHTS.inCare
    + lowPresenceScore
    + noPresenceScore;
}

export function teamGroupPastoralPriorityScore(group: GroupPastoralPriorityInput) {
  return groupPastoralPriorityScore(group);
}

export function teamGroupStatusLabel({
  urgentCount,
  pastoralCasesCount,
  supportRequestsCount = 0,
  localAttentionCount = 0,
  inCareCount = 0,
  hasNoPresenceData,
  hasLowPresence: lowPresence,
}: {
  urgentCount: number;
  pastoralCasesCount: number;
  supportRequestsCount?: number;
  localAttentionCount?: number;
  inCareCount?: number;
  hasNoPresenceData: boolean;
  hasLowPresence: boolean;
}) {
  if (urgentCount > 0) return countLabel(urgentCount, "urgente", "urgentes");
  if (pastoralCasesCount > 0) return countLabel(pastoralCasesCount, "encaminhado", "encaminhados");
  if (supportRequestsCount > 0) return countLabel(supportRequestsCount, "pedido de apoio", "pedidos de apoio");
  if (localAttentionCount > 0) return countLabel(localAttentionCount, "irmão em atenção", "irmãos em atenção");
  if (inCareCount > 0) return countLabel(inCareCount, "em cuidado", "em cuidado");
  if (lowPresence) return "Presença baixa";
  if (hasNoPresenceData) return NO_RECENT_PRESENCE_LABEL;

  return "Estável";
}
