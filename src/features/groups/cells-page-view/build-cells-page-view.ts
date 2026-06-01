import {
  groupNeedsPastoralAttention,
  groupRiskCount,
} from "@/features/groups/group-pastoral-priority";
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
  const groupsNeedingAttentionCount = dashboard.groups.filter(groupNeedsPastoralAttention).length;
  const groupsWithoutPresenceCount = dashboard.groups.filter((group) => !group.hasPresenceData).length;
  const hasRisk = dashboard.groups.some((group) => groupRiskCount(group) > 0);
  const hasCare = dashboard.groups.some((group) => group.inCareCount > 0);
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
