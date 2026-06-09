import { matchesSupervisorGroupFilter } from "@/features/groups/group-filtering";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import { matchesNormalizedQuery } from "@/lib/text";
import type { SupervisorGroup } from "@/features/groups/cells-page-view/cells-page-view.types";
import { compareGroups, groupSearchText } from "@/features/groups/cells-page-view/cells-group-display";

export function supervisorGroupMatchesFilter(group: SupervisorGroup, filter: CellsFilter) {
  return matchesSupervisorGroupFilter(group, filter);
}

export const groupMatchesFilter = supervisorGroupMatchesFilter;

export function filterCellsPageGroups(groups: SupervisorGroup[], normalizedQuery: string, filter: CellsFilter) {
  return groups
    .filter((group) => supervisorGroupMatchesFilter(group, filter))
    .filter((group) => matchesNormalizedQuery(groupSearchText(group), normalizedQuery))
    .sort(compareGroups);
}
