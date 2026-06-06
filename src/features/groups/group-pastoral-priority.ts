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

export type GroupPastoralLifecycleKey = GroupPastoralStatusKey | "newWithoutHistory";

export type GroupPresenceStatusKey =
  | "newWithoutHistory"
  | "withoutRecentPresence"
  | "lowPresence"
  | "recordedPresence";

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

export type GroupPastoralState = {
  urgentCount: number;
  pastoralCasesCount: number;
  supportRequestsCount: number;
  riskCount: number;
  localAttentionCount: number;
  inCareCount: number;
  attentionCount: number;
  hasPresenceHistory: boolean;
  hasNoRecentPresence: boolean;
  hasLowPresence: boolean;
  presenceStatusKey: GroupPresenceStatusKey;
  statusKey: GroupPastoralStatusKey;
  lifecycleKey: GroupPastoralLifecycleKey;
  needsPastoralAttention: boolean;
  needsTeamAttention: boolean;
  priorityScore: number;
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

export function groupPresenceStatusKey(group: Pick<GroupPastoralPriorityInput, "hasPresenceData" | "presenceRate" | "recordedEventsCount">): GroupPresenceStatusKey {
  if (!hasPresenceHistory(group)) return "newWithoutHistory";
  if (hasNoRecentPresence(group)) return "withoutRecentPresence";
  if (hasLowPresence(group)) return "lowPresence";

  return "recordedPresence";
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

function resolveGroupPastoralStatusKey({
  urgentCount,
  pastoralCasesCount,
  supportRequestsCount,
  localAttentionCount,
  inCareCount,
  presenceStatusKey,
}: Pick<GroupPastoralState, "urgentCount" | "pastoralCasesCount" | "supportRequestsCount" | "localAttentionCount" | "inCareCount" | "presenceStatusKey">): GroupPastoralStatusKey {
  if (urgentCount > 0) return "urgent";
  if (pastoralCasesCount > 0) return "pastoralCase";
  if (supportRequestsCount > 0) return "supportRequest";
  if (localAttentionCount > 0 || inCareCount > 0 || presenceStatusKey === "lowPresence") return "localAttention";
  if (presenceStatusKey === "withoutRecentPresence") return "withoutRecentPresence";

  return "stable";
}

export function groupPastoralState(group: GroupPastoralPriorityInput): GroupPastoralState {
  const urgentCount = groupUrgentCount(group);
  const pastoralCasesCount = groupPastoralCasesCount(group);
  const supportRequestsCount = groupSupportRequestsCount(group);
  const riskCount = urgentCount + pastoralCasesCount;
  const localAttentionCount = groupLocalAttentionCount({
    ...group,
    urgentCount,
    pastoralCasesCount,
    supportRequestsCount,
  });
  const inCareCount = group.inCareCount ?? 0;
  const attentionCount = group.attentionCount ?? 0;
  const presenceStatusKey = groupPresenceStatusKey(group);
  const hasPresenceHistoryValue = presenceStatusKey !== "newWithoutHistory";
  const hasNoRecentPresenceValue = presenceStatusKey === "withoutRecentPresence";
  const hasLowPresenceValue = presenceStatusKey === "lowPresence";
  const statusKey = resolveGroupPastoralStatusKey({
    urgentCount,
    pastoralCasesCount,
    supportRequestsCount,
    localAttentionCount,
    inCareCount,
    presenceStatusKey,
  });
  const lifecycleKey: GroupPastoralLifecycleKey = presenceStatusKey === "newWithoutHistory" && statusKey === "stable"
    ? "newWithoutHistory"
    : statusKey;
  const lowPresenceScore = hasLowPresenceValue ? LOW_PRESENCE_THRESHOLD - group.presenceRate : 0;
  const noPresenceScore = hasNoRecentPresenceValue ? NO_RECENT_PRESENCE_PRIORITY : 0;
  const priorityScore = urgentCount * GROUP_PRIORITY_WEIGHTS.urgent
    + pastoralCasesCount * GROUP_PRIORITY_WEIGHTS.pastoralCase
    + supportRequestsCount * GROUP_PRIORITY_WEIGHTS.supportRequest
    + localAttentionCount * GROUP_PRIORITY_WEIGHTS.localAttention
    + inCareCount * GROUP_PRIORITY_WEIGHTS.inCare
    + lowPresenceScore
    + noPresenceScore;

  return {
    urgentCount,
    pastoralCasesCount,
    supportRequestsCount,
    riskCount,
    localAttentionCount,
    inCareCount,
    attentionCount,
    hasPresenceHistory: hasPresenceHistoryValue,
    hasNoRecentPresence: hasNoRecentPresenceValue,
    hasLowPresence: hasLowPresenceValue,
    presenceStatusKey,
    statusKey,
    lifecycleKey,
    needsPastoralAttention: riskCount > 0
      || supportRequestsCount > 0
      || localAttentionCount > 0
      || hasLowPresenceValue,
    needsTeamAttention: statusKey !== "stable" && statusKey !== "withoutRecentPresence",
    priorityScore,
  };
}

export function groupPastoralStatusKey(group: GroupPastoralPriorityInput): GroupPastoralStatusKey {
  return groupPastoralState(group).statusKey;
}

export function groupPastoralPriorityScore(group: GroupPastoralPriorityInput) {
  return groupPastoralState(group).priorityScore;
}

export function teamGroupPastoralPriorityScore(group: GroupPastoralPriorityInput) {
  return groupPastoralState(group).priorityScore;
}

export function teamGroupStatusLabel(group: {
  urgentCount: number;
  pastoralCasesCount: number;
  supportRequestsCount?: number;
  localAttentionCount?: number;
  inCareCount?: number;
  hasNoPresenceData: boolean;
  hasLowPresence: boolean;
}) {
  if (group.urgentCount > 0) return countLabel(group.urgentCount, "urgente", "urgentes");
  if (group.pastoralCasesCount > 0) return countLabel(group.pastoralCasesCount, "encaminhado", "encaminhados");
  if ((group.supportRequestsCount ?? 0) > 0) return countLabel(group.supportRequestsCount ?? 0, "pedido de apoio", "pedidos de apoio");
  if ((group.localAttentionCount ?? 0) > 0) return countLabel(group.localAttentionCount ?? 0, "irmão em atenção", "irmãos em atenção");
  if ((group.inCareCount ?? 0) > 0) return countLabel(group.inCareCount ?? 0, "em cuidado", "em cuidado");
  if (group.hasLowPresence) return "Presença baixa";
  if (group.hasNoPresenceData) return NO_RECENT_PRESENCE_LABEL;

  return "Estável";
}
