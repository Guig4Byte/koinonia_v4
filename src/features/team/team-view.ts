import type { getPastorTeamOverview } from "@/features/dashboard/queries";
import type { SignalBadgeTone } from "@/features/signals/display";
import { hasLowPresence } from "@/features/groups/group-pastoral-priority";
import { weekdayLabel } from "@/features/groups/weekdays";
import { normalizeSearchText } from "@/lib/text";

export const TEAM_SECTION_LIMIT = 4;
export const SUPERVISOR_SECTION_LIMIT = 4;
export const GROUPS_PER_SUPERVISOR_LIMIT = 4;
export const SUPERVISORS_SECTION_ID = "supervisores";


export type TeamFilter = "todos" | "atencao" | "sem-presenca";

export const TEAM_FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

export type TeamOverview = Awaited<ReturnType<typeof getPastorTeamOverview>>;
export type SupervisorTeam = TeamOverview["supervisors"][number];
export type TeamGroup = SupervisorTeam["groups"][number];
export type InactiveTeamGroup = {
  id: string;
  name: string;
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
  locationName: string | null;
};

export type TeamPageLists = {
  filteredSupervisors: SupervisorTeam[];
  filteredUnassignedGroups: TeamGroup[];
  filteredInactiveGroups: InactiveTeamGroup[];
  isFiltered: boolean;
};

export function readTeamFilter(value: string): TeamFilter {
  return TEAM_FILTERS.some((filter) => filter.value === value) ? value as TeamFilter : "todos";
}

export function groupMatchesQuery(group: TeamGroup, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(`${group.name} ${group.leadershipName}`);
  return haystack.includes(normalizedQuery);
}

export function supervisorMatchesQuery(supervisor: SupervisorTeam, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(`${supervisor.name} ${supervisor.email}`);
  return haystack.includes(normalizedQuery);
}

export function inactiveGroupMatchesQuery(group: InactiveTeamGroup, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const haystack = normalizeSearchText(`${group.name} ${group.locationName ?? ""}`);
  return haystack.includes(normalizedQuery);
}

export function groupMatchesFilter(group: TeamGroup, filter: TeamFilter) {
  if (filter === "atencao") return group.pastoralPriorityScore > 0;
  if (filter === "sem-presenca") return group.hasNoPresenceData;
  return true;
}

export function filterGroups(groups: TeamGroup[], normalizedQuery: string, filter: TeamFilter) {
  return groups.filter((group) => groupMatchesFilter(group, filter) && groupMatchesQuery(group, normalizedQuery));
}

export function filterSupervisorGroups(supervisor: SupervisorTeam, normalizedQuery: string, filter: TeamFilter) {
  const supervisorMatches = supervisorMatchesQuery(supervisor, normalizedQuery);

  return supervisor.groups.filter((group) => {
    if (!groupMatchesFilter(group, filter)) return false;
    if (!normalizedQuery) return true;
    return supervisorMatches || groupMatchesQuery(group, normalizedQuery);
  });
}

export function withFilteredGroups(supervisor: SupervisorTeam, groups: TeamGroup[]): SupervisorTeam {
  return {
    ...supervisor,
    groups,
    highestPriorityScore: groups[0]?.pastoralPriorityScore ?? 0,
    groupsNeedingAttentionCount: groups.filter((group) => group.pastoralPriorityScore > 0).length,
    pastoralCasesCount: groups.reduce((total, group) => total + group.pastoralCasesCount, 0),
    urgentCount: groups.reduce((total, group) => total + group.urgentCount, 0),
    attentionCount: groups.reduce((total, group) => total + group.attentionCount, 0),
    groupsWithoutPresenceCount: groups.filter((group) => !group.hasPresenceData).length,
    lowPresenceGroupsCount: groups.filter((group) => group.hasPresenceData && group.hasLowPresence).length,
  };
}

export function filterSupervisors(supervisors: SupervisorTeam[], normalizedQuery: string, filter: TeamFilter) {
  return supervisors.flatMap((supervisor) => {
    const groups = filterSupervisorGroups(supervisor, normalizedQuery, filter);

    if (groups.length > 0) return [withFilteredGroups(supervisor, groups)];

    // Na visão padrão, Equipe é estrutura pastoral: todos os supervisores ativos aparecem,
    // mesmo quando não têm célula ativa vinculada. Os filtros continuam mostrando só
    // supervisores que possuem células no recorte escolhido.
    if (filter === "todos" && supervisorMatchesQuery(supervisor, normalizedQuery)) {
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
    filteredSupervisors: filterSupervisors(team.supervisors, normalizedQuery, activeFilter),
    filteredUnassignedGroups: filterGroups(team.unassignedGroups, normalizedQuery, activeFilter),
    filteredInactiveGroups: activeFilter === "todos"
      ? inactiveGroups.filter((group) => inactiveGroupMatchesQuery(group, normalizedQuery))
      : [],
    isFiltered: Boolean(normalizedQuery) || activeFilter !== "todos",
  };
}

export function compactGroupSubtitle(group: TeamGroup) {
  const membersLabel = `${group.membersCount} ${group.membersCount === 1 ? "membro" : "membros"}`;
  return `${group.leadershipName} · ${membersLabel}`;
}

export function groupBadgeTone(group: TeamGroup): SignalBadgeTone {
  if (group.urgentCount > 0 || group.pastoralCasesCount > 0) return "risk";
  if (!group.hasPresenceData) return "neutral";
  if (hasLowPresence(group)) return "warn";
  return "ok";
}

export function shouldShowGroupBadge(group: TeamGroup) {
  return group.statusLabel !== "Estável";
}

export function supervisorSummary(supervisor: SupervisorTeam) {
  const groupsLabel = `${supervisor.groups.length} ${supervisor.groups.length === 1 ? "célula acompanhada" : "células acompanhadas"}`;

  if (supervisor.urgentCount > 0) {
    return `${groupsLabel} · ${supervisor.urgentCount} ${supervisor.urgentCount === 1 ? "urgente" : "urgentes"}.`;
  }

  if (supervisor.pastoralCasesCount > 0) {
    return `${groupsLabel} · ${supervisor.pastoralCasesCount} ${supervisor.pastoralCasesCount === 1 ? "caso pastoral" : "casos pastorais"}.`;
  }

  if (supervisor.groupsNeedingAttentionCount > 0) {
    return `${groupsLabel} · ${supervisor.groupsNeedingAttentionCount} ${supervisor.groupsNeedingAttentionCount === 1 ? "célula pede" : "células pedem"} atenção.`;
  }

  if (supervisor.groupsWithoutPresenceCount > 0) {
    return `${groupsLabel} · ${supervisor.groupsWithoutPresenceCount} sem presença recente.`;
  }

  return groupsLabel;
}

export function supervisorBadgeTone(supervisor: SupervisorTeam): SignalBadgeTone {
  if (supervisor.urgentCount > 0 || supervisor.pastoralCasesCount > 0) return "risk";
  if (supervisor.lowPresenceGroupsCount > 0) return "warn";
  return "neutral";
}

export function inactiveGroupScheduleText(group: InactiveTeamGroup) {
  if (group.meetingDayOfWeek === null || !group.meetingTime) return "Sem agenda padrão";
  return `${weekdayLabel(group.meetingDayOfWeek)} · ${group.meetingTime}`;
}

export function teamSavedMessage(savedParam: string) {
  if (savedParam === "celula-criada") return "Célula criada.";
  if (savedParam === "celula-atualizada") return "Célula atualizada.";
  return null;
}

export function teamNavIndicator(summary: TeamOverview["summary"]) {
  if (summary.urgentCount > 0 || summary.pastoralCasesCount > 0) return "risk" as const;
  if (summary.groupsNeedingAttentionCount > 0) return "attention" as const;
  return undefined;
}
