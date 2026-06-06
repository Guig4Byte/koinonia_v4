import {
  groupLocalAttentionCount,
  groupPastoralEscalatedCount,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
  hasNoRecentPresence,
} from "@/features/groups/group-pastoral-priority";
import { groupAttentionLabel, type SignalBadge } from "@/features/signals/display";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import type {
  GroupCareStatusKey,
  GroupCareStatusSummary,
  SupervisorGroup,
} from "@/features/groups/cells-page-view/cells-page-view.types";
import { NO_RECENT_PRESENCE_BADGE_LABEL } from "@/features/groups/cells-page-view/cells-page-view.constants";
import { countLabel } from "@/lib/format";
import { joinLabelsPtBr } from "@/lib/list-label";
import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_PRESENCE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";

function groupCareStatusSummaries(group: SupervisorGroup): GroupCareStatusSummary[] {
  const summaries: GroupCareStatusSummary[] = [
    { key: "urgent", count: groupUrgentCount(group), label: "urgência" },
    { key: "pastoral", count: groupPastoralEscalatedCount(group), label: "encaminhamento" },
    { key: "support", count: groupSupportRequestsCount(group), label: "apoio" },
    { key: "attention", count: groupLocalAttentionCount(group), label: "atenção" },
    { key: "care", count: group.inCareCount, label: "cuidado" },
    { key: "noPresence", count: hasNoRecentPresence(group) ? 1 : 0, label: "sem presença recente" },
    { key: "lowPresence", count: hasLowPresence(group) ? 1 : 0, label: "presença baixa" },
  ];

  return summaries.filter((item) => item.count > 0);
}

function groupPrimaryStatusKey(group: SupervisorGroup, filter: CellsFilter): GroupCareStatusKey | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) return "urgent";
  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) return "pastoral";
  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) return "support";
  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) return "attention";
  if (filter === FILTER_IN_CARE && group.inCareCount > 0) return "care";
  if (filter === FILTER_NO_RECENT_PRESENCE && hasNoRecentPresence(group)) return "noPresence";
  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) return "lowPresence";

  if (filter === FILTER_PRESENCE) {
    if (hasNoRecentPresence(group)) return "noPresence";
    if (hasLowPresence(group)) return "lowPresence";
  }

  if (groupUrgentCount(group) > 0) return "urgent";
  if (groupPastoralEscalatedCount(group) > 0) return "pastoral";
  if (groupSupportRequestsCount(group) > 0) return "support";
  if (groupLocalAttentionCount(group) > 0) return "attention";
  if (hasNoRecentPresence(group)) return "noPresence";
  if (hasLowPresence(group)) return "lowPresence";
  if (group.inCareCount > 0) return "care";

  return null;
}

export function groupStatusSummary(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): string | undefined {
  const primaryStatusKey = groupPrimaryStatusKey(group, filter);
  const secondaryStatuses = groupCareStatusSummaries(group).filter((item) => item.key !== primaryStatusKey);
  const secondaryStatusLabels = secondaryStatuses.map((item) => item.label);

  if (secondaryStatuses.length === 0) return undefined;
  if (secondaryStatuses.length <= 2) return `Também há ${joinLabelsPtBr(secondaryStatusLabels)}`;
  if (secondaryStatuses.length === 3) return `Também há ${joinLabelsPtBr(secondaryStatusLabels)} no radar`;

  const visibleStatusLabels = secondaryStatusLabels.slice(0, 3);
  const remainingStatusesCount = secondaryStatuses.length - visibleStatusLabels.length;

  return `Também há ${joinLabelsPtBr(visibleStatusLabels)} e mais ${countLabel(remainingStatusesCount, "frente", "frentes")} no radar`;
}

function contextualGroupBadge(group: SupervisorGroup, filter: CellsFilter): SignalBadge | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) {
    return { label: groupAttentionLabel(groupUrgentCount(group), "urgente", "urgentes"), tone: "risk" };
  }

  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) {
    return { label: groupAttentionLabel(groupPastoralEscalatedCount(group), "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) {
    return { label: groupAttentionLabel(groupSupportRequestsCount(group), "apoio", "apoios"), tone: "support" };
  }

  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) {
    return { label: groupAttentionLabel(groupLocalAttentionCount(group), "em atenção", "em atenção"), tone: "warn" };
  }

  if (filter === FILTER_IN_CARE && group.inCareCount > 0) {
    return { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  if (filter === FILTER_NO_RECENT_PRESENCE && hasNoRecentPresence(group)) {
    return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
  }

  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (filter === FILTER_PRESENCE) {
    if (hasNoRecentPresence(group)) return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
    if (hasLowPresence(group)) return { label: "Presença baixa", tone: "warn" };
  }

  return null;
}

export function groupBadge(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): SignalBadge | null {
  const contextualBadge = contextualGroupBadge(group, filter);
  if (contextualBadge) return contextualBadge;

  const urgent = groupUrgentCount(group);
  const escalated = groupPastoralEscalatedCount(group);

  if (urgent > 0) {
    return { label: groupAttentionLabel(urgent, "urgente", "urgentes"), tone: "risk" };
  }

  if (escalated > 0) {
    return { label: groupAttentionLabel(escalated, "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (group.supportRequestsCount > 0) {
    return { label: groupAttentionLabel(group.supportRequestsCount, "apoio", "apoios"), tone: "support" };
  }

  const localAttention = groupLocalAttentionCount(group);

  if (localAttention > 0) {
    return { label: groupAttentionLabel(localAttention, "em atenção", "em atenção"), tone: "warn" };
  }

  if (hasNoRecentPresence(group)) {
    return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
  }

  if (hasLowPresence(group)) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (group.inCareCount > 0) {
    return { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  return null;
}
