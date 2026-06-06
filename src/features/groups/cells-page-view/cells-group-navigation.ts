import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
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
  const state = groupPastoralState(group);

  if (filter === FILTER_URGENT && state.urgentCount > 0) return FILTER_URGENT;
  if (filter === FILTER_PASTORAL && state.pastoralCasesCount > 0) return FILTER_PASTORAL;
  if (filter === FILTER_SUPPORT && state.supportRequestsCount > 0) return FILTER_SUPPORT;
  if (filter === FILTER_ATTENTION && state.localAttentionCount > 0) return FILTER_ATTENTION;
  if (filter === FILTER_IN_CARE && state.inCareCount > 0) return FILTER_IN_CARE;
  if (filter === FILTER_NO_RECENT_PRESENCE && state.hasNoRecentPresence) return FILTER_NO_RECENT_PRESENCE;
  if (filter === FILTER_LOW_PRESENCE && state.hasLowPresence) return FILTER_LOW_PRESENCE;

  if (filter === FILTER_PRESENCE) {
    if (state.hasNoRecentPresence) return FILTER_NO_RECENT_PRESENCE;
    if (state.hasLowPresence) return FILTER_LOW_PRESENCE;
  }

  return null;
}

export function groupDetailNavigationFocus(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): GroupDetailNavigationFocus | null {
  const contextualFocus = contextualGroupFocus(group, filter);
  if (contextualFocus) return contextualFocus;

  const state = groupPastoralState(group);

  if (state.urgentCount > 0) return FILTER_URGENT;
  if (state.pastoralCasesCount > 0) return FILTER_PASTORAL;
  if (state.supportRequestsCount > 0) return FILTER_SUPPORT;
  if (state.localAttentionCount > 0) return FILTER_ATTENTION;
  if (state.inCareCount > 0) return FILTER_IN_CARE;
  if (state.hasNoRecentPresence) return FILTER_NO_RECENT_PRESENCE;
  if (state.hasLowPresence) return FILTER_LOW_PRESENCE;

  return null;
}

export function groupDetailHref(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL) {
  return routeWithQuery(`/celulas/${group.id}`, { foco: groupDetailNavigationFocus(group, filter) });
}
