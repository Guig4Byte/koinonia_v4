import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
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
  const state = groupPastoralState(group);
  const summaries: GroupCareStatusSummary[] = [
    { key: "urgent", count: state.urgentCount, label: "urgência" },
    { key: "pastoral", count: state.pastoralCasesCount, label: "encaminhamento" },
    { key: "support", count: state.supportRequestsCount, label: "apoio" },
    { key: "attention", count: state.localAttentionCount, label: "atenção" },
    { key: "care", count: state.inCareCount, label: "cuidado" },
    { key: "noPresence", count: state.hasNoRecentPresence ? 1 : 0, label: "sem presença recente" },
    { key: "lowPresence", count: state.hasLowPresence ? 1 : 0, label: "presença baixa" },
  ];

  return summaries.filter((item) => item.count > 0);
}

function groupPrimaryStatusKey(group: SupervisorGroup, filter: CellsFilter): GroupCareStatusKey | null {
  const state = groupPastoralState(group);

  if (filter === FILTER_URGENT && state.urgentCount > 0) return "urgent";
  if (filter === FILTER_PASTORAL && state.pastoralCasesCount > 0) return "pastoral";
  if (filter === FILTER_SUPPORT && state.supportRequestsCount > 0) return "support";
  if (filter === FILTER_ATTENTION && state.localAttentionCount > 0) return "attention";
  if (filter === FILTER_IN_CARE && state.inCareCount > 0) return "care";
  if (filter === FILTER_NO_RECENT_PRESENCE && state.hasNoRecentPresence) return "noPresence";
  if (filter === FILTER_LOW_PRESENCE && state.hasLowPresence) return "lowPresence";

  if (filter === FILTER_PRESENCE) {
    if (state.hasNoRecentPresence) return "noPresence";
    if (state.hasLowPresence) return "lowPresence";
  }

  if (state.urgentCount > 0) return "urgent";
  if (state.pastoralCasesCount > 0) return "pastoral";
  if (state.supportRequestsCount > 0) return "support";
  if (state.localAttentionCount > 0) return "attention";
  if (state.hasNoRecentPresence) return "noPresence";
  if (state.hasLowPresence) return "lowPresence";
  if (state.inCareCount > 0) return "care";

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
  const state = groupPastoralState(group);

  if (filter === FILTER_URGENT && state.urgentCount > 0) {
    return { label: groupAttentionLabel(state.urgentCount, "urgente", "urgentes"), tone: "risk" };
  }

  if (filter === FILTER_PASTORAL && state.pastoralCasesCount > 0) {
    return { label: groupAttentionLabel(state.pastoralCasesCount, "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (filter === FILTER_SUPPORT && state.supportRequestsCount > 0) {
    return { label: groupAttentionLabel(state.supportRequestsCount, "apoio", "apoios"), tone: "support" };
  }

  if (filter === FILTER_ATTENTION && state.localAttentionCount > 0) {
    return { label: groupAttentionLabel(state.localAttentionCount, "em atenção", "em atenção"), tone: "warn" };
  }

  if (filter === FILTER_IN_CARE && state.inCareCount > 0) {
    return { label: groupAttentionLabel(state.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  if (filter === FILTER_NO_RECENT_PRESENCE && state.hasNoRecentPresence) {
    return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
  }

  if (filter === FILTER_LOW_PRESENCE && state.hasLowPresence) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (filter === FILTER_PRESENCE) {
    if (state.hasNoRecentPresence) return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
    if (state.hasLowPresence) return { label: "Presença baixa", tone: "warn" };
  }

  return null;
}

export function groupBadge(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): SignalBadge | null {
  const contextualBadge = contextualGroupBadge(group, filter);
  if (contextualBadge) return contextualBadge;

  const state = groupPastoralState(group);

  if (state.urgentCount > 0) {
    return { label: groupAttentionLabel(state.urgentCount, "urgente", "urgentes"), tone: "risk" };
  }

  if (state.pastoralCasesCount > 0) {
    return { label: groupAttentionLabel(state.pastoralCasesCount, "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (state.supportRequestsCount > 0) {
    return { label: groupAttentionLabel(state.supportRequestsCount, "apoio", "apoios"), tone: "support" };
  }

  if (state.localAttentionCount > 0) {
    return { label: groupAttentionLabel(state.localAttentionCount, "em atenção", "em atenção"), tone: "warn" };
  }

  if (state.hasNoRecentPresence) {
    return { label: NO_RECENT_PRESENCE_BADGE_LABEL, tone: "neutral" };
  }

  if (state.hasLowPresence) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (state.inCareCount > 0) {
    return { label: groupAttentionLabel(state.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  return null;
}
