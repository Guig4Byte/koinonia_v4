import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { GROUP_SECTIONS } from "@/features/groups/cells-page-view/cells-page-view.constants";
import type { CellsPageView, SupervisorDashboard } from "@/features/groups/cells-page-view/cells-page-view.types";
import { compareGroups } from "@/features/groups/cells-page-view/cells-group-display";
import { filterCellsPageGroups } from "@/features/groups/cells-page-view/cells-group-filtering";
import { groupSectionKey } from "@/features/groups/cells-page-view/cells-group-section";

export function buildCellsPageView({
  dashboard,
  query,
  normalizedQuery,
  filter,
}: {
  dashboard: SupervisorDashboard;
  query: string;
  normalizedQuery: string;
  filter: CellsFilter;
}): CellsPageView {
  const groups = filterCellsPageGroups(dashboard.groups, normalizedQuery, filter);
  const groupStates = dashboard.groups.map((group) => groupPastoralState(group));
  const groupsNeedingAttentionCount = groupStates.filter((state) => state.needsPastoralAttention).length;
  const groupsWithoutPresenceCount = groupStates.filter((state) => state.hasNoRecentPresence).length;
  const hasRisk = groupStates.some((state) => state.riskCount > 0);
  const hasCare = groupStates.some((state) => state.inCareCount > 0);
  const navIndicator = hasRisk ? "risk" : groupsNeedingAttentionCount > 0 ? "attention" : hasCare ? "care" : undefined;

  return {
    groups,
    groupedSections: GROUP_SECTIONS.map((section) => ({
      ...section,
      groups: groups.filter((group) => groupSectionKey(group) === section.key).sort(compareGroups),
    })).filter((section) => section.groups.length > 0),
    groupsNeedingAttentionCount,
    groupsWithoutPresenceCount,
    navIndicator,
    isFiltered: Boolean(query) || filter !== FILTER_ALL,
  };
}
