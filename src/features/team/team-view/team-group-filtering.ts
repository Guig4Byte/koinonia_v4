import { matchesTeamGroupFilter } from "@/features/groups/group-filtering";
import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import type { TeamFilter } from "@/features/team/team-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { matchesNormalizedQuery } from "@/lib/text";
import type {
  InactiveTeamGroup,
  SupervisorTeam,
  TeamGroup,
  TeamOverview,
  TeamPageLists,
} from "./team-view.types";

export function groupMatchesQuery(group: TeamGroup, normalizedQuery: string) {
  return matchesNormalizedQuery(
    `${group.name} ${group.leadershipName}`,
    normalizedQuery,
  );
}

export function supervisorMatchesQuery(
  supervisor: SupervisorTeam,
  normalizedQuery: string,
) {
  return matchesNormalizedQuery(
    `${supervisor.name} ${supervisor.email}`,
    normalizedQuery,
  );
}

export function inactiveGroupMatchesQuery(
  group: InactiveTeamGroup,
  normalizedQuery: string,
) {
  return matchesNormalizedQuery(
    `${group.name} ${group.locationName ?? ""}`,
    normalizedQuery,
  );
}

export function teamGroupMatchesFilter(group: TeamGroup, filter: TeamFilter) {
  return matchesTeamGroupFilter(group, filter);
}

export const groupMatchesFilter = teamGroupMatchesFilter;

export function filterGroups(
  groups: TeamGroup[],
  normalizedQuery: string,
  filter: TeamFilter,
) {
  return groups.filter(
    (group) =>
      teamGroupMatchesFilter(group, filter) &&
      groupMatchesQuery(group, normalizedQuery),
  );
}

export function filterSupervisorGroups(
  supervisor: SupervisorTeam,
  normalizedQuery: string,
  filter: TeamFilter,
) {
  const supervisorMatches = supervisorMatchesQuery(supervisor, normalizedQuery);

  return supervisor.groups.filter((group) => {
    if (!teamGroupMatchesFilter(group, filter)) return false;
    if (!normalizedQuery) return true;
    return supervisorMatches || groupMatchesQuery(group, normalizedQuery);
  });
}

export function withFilteredGroups(
  supervisor: SupervisorTeam,
  groups: TeamGroup[],
): SupervisorTeam {
  return {
    ...supervisor,
    groups,
    highestPriorityScore: groups[0]?.pastoralPriorityScore ?? 0,
    groupsNeedingAttentionCount: groups.filter((group) => groupPastoralState(group).needsTeamAttention).length,
    pastoralCasesCount: groups.reduce(
      (total, group) => total + group.pastoralCasesCount,
      0,
    ),
    urgentCount: groups.reduce((total, group) => total + group.urgentCount, 0),
    supportRequestsCount: groups.reduce(
      (total, group) => total + group.supportRequestsCount,
      0,
    ),
    localAttentionCount: groups.reduce(
      (total, group) => total + group.localAttentionCount,
      0,
    ),
    attentionCount: groups.reduce(
      (total, group) => total + group.attentionCount,
      0,
    ),
    groupsWithoutPresenceCount: groups.filter((group) => groupPastoralState(group).hasNoRecentPresence).length,
    lowPresenceGroupsCount: groups.filter((group) => groupPastoralState(group).hasLowPresence).length,
  };
}

export function filterSupervisors(
  supervisors: SupervisorTeam[],
  normalizedQuery: string,
  filter: TeamFilter,
) {
  return supervisors.flatMap((supervisor) => {
    const groups = filterSupervisorGroups(supervisor, normalizedQuery, filter);

    if (groups.length > 0) return [withFilteredGroups(supervisor, groups)];

    // Na visão padrão, Equipe é estrutura pastoral: todos os supervisores ativos aparecem,
    // mesmo quando não têm célula ativa vinculada. Os filtros continuam mostrando só
    // supervisores que possuem células no recorte escolhido.
    if (
      filter === FILTER_ALL &&
      supervisorMatchesQuery(supervisor, normalizedQuery)
    ) {
      return [withFilteredGroups(supervisor, [])];
    }

    return [];
  });
}

export function buildTeamPageLists({
  team,
  inactiveGroups,
  normalizedQuery,
  activeFilter,
}: {
  team: TeamOverview;
  inactiveGroups: InactiveTeamGroup[];
  normalizedQuery: string;
  activeFilter: TeamFilter;
}): TeamPageLists {
  return {
    filteredSupervisors: filterSupervisors(
      team.supervisors,
      normalizedQuery,
      activeFilter,
    ),
    filteredUnassignedGroups: filterGroups(
      team.unassignedGroups,
      normalizedQuery,
      activeFilter,
    ),
    filteredInactiveGroups:
      activeFilter === FILTER_ALL
        ? inactiveGroups.filter((group) =>
            inactiveGroupMatchesQuery(group, normalizedQuery),
          )
        : [],
    isFiltered: Boolean(normalizedQuery) || activeFilter !== FILTER_ALL,
  };
}
