import {
  groupLocalAttentionCount,
  groupPastoralEscalatedCount,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
  hasNoRecentPresence,
} from "@/features/groups/group-pastoral-priority";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import type { GroupDetailNavigationFocus, SupervisorGroup } from "@/features/groups/cells-page-view/cells-page-view.types";
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
import { routeWithQuery } from "@/lib/routes";

function contextualGroupFocus(group: SupervisorGroup, filter: CellsFilter): GroupDetailNavigationFocus | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) return FILTER_URGENT;
  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) return FILTER_PASTORAL;
  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) return FILTER_SUPPORT;
  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) return FILTER_ATTENTION;
  if (filter === FILTER_IN_CARE && group.inCareCount > 0) return FILTER_IN_CARE;
  if (filter === FILTER_NO_RECENT_PRESENCE && hasNoRecentPresence(group)) return FILTER_NO_RECENT_PRESENCE;
  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) return FILTER_LOW_PRESENCE;

  if (filter === FILTER_PRESENCE) {
    if (hasNoRecentPresence(group)) return FILTER_NO_RECENT_PRESENCE;
    if (hasLowPresence(group)) return FILTER_LOW_PRESENCE;
  }

  return null;
}

export function groupDetailNavigationFocus(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): GroupDetailNavigationFocus | null {
  const contextualFocus = contextualGroupFocus(group, filter);
  if (contextualFocus) return contextualFocus;

  if (groupUrgentCount(group) > 0) return FILTER_URGENT;
  if (groupPastoralEscalatedCount(group) > 0) return FILTER_PASTORAL;
  if (groupSupportRequestsCount(group) > 0) return FILTER_SUPPORT;
  if (groupLocalAttentionCount(group) > 0) return FILTER_ATTENTION;
  if (group.inCareCount > 0) return FILTER_IN_CARE;
  if (hasNoRecentPresence(group)) return FILTER_NO_RECENT_PRESENCE;
  if (hasLowPresence(group)) return FILTER_LOW_PRESENCE;

  return null;
}

export function groupDetailHref(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL) {
  return routeWithQuery(`/celulas/${group.id}`, { foco: groupDetailNavigationFocus(group, filter) });
}
