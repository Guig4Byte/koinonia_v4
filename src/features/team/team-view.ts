import type { getPastorTeamOverview } from "@/features/dashboard/queries";
import type { SignalBadgeTone } from "@/features/signals/display";
import { groupPastoralStatusKey, hasLowPresence, type GroupPastoralStatusKey } from "@/features/groups/group-pastoral-priority";
import { weekdayLabel } from "@/features/groups/weekdays";
import { teamFilterToGroupFocus, type TeamFilter } from "@/features/team/team-filters";
import { FILTER_ALL, FILTER_ATTENTION, FILTER_NO_RECENT_PRESENCE, FILTER_PASTORAL, FILTER_STABLE, FILTER_SUPPORT, FILTER_URGENT } from "@/lib/filter-param";
import { matchesNormalizedQuery } from "@/lib/text";
import { countLabel } from "@/lib/format";
import { routeWithQuery, ROUTES } from "@/lib/routes";

export const TEAM_SECTION_LIMIT = 4;
export const SUPERVISOR_SECTION_LIMIT = 4;
export const GROUPS_PER_SUPERVISOR_LIMIT = 4;
export const SUPERVISORS_SECTION_ID = "supervisores";


export { readTeamFilter, TEAM_FILTERS, type TeamFilter } from "@/features/team/team-filters";

const filterToStatusKey: Partial<Record<TeamFilter, GroupPastoralStatusKey>> = {
  [FILTER_URGENT]: "urgent",
  [FILTER_PASTORAL]: "pastoralCase",
  [FILTER_SUPPORT]: "supportRequest",
  [FILTER_ATTENTION]: "localAttention",
  [FILTER_NO_RECENT_PRESENCE]: "withoutRecentPresence",
  [FILTER_STABLE]: "stable",
};

const teamFilterCopy: Record<TeamFilter, { title: string; detail: string; empty: string }> = {
  [FILTER_ALL]: {
    title: "Estrutura da equipe",
    detail: "Busque ou filtre por atenção.",
    empty: "Ajuste a busca ou limpe os filtros para conferir toda a estrutura pastoral.",
  },
  [FILTER_URGENT]: {
    title: "Células com urgentes",
    detail: "Sinais que pedem atenção imediata no contexto da célula.",
    empty: "Nenhuma célula com sinal urgente nesse recorte.",
  },
  [FILTER_PASTORAL]: {
    title: "Células encaminhadas ao pastor",
    detail: "Casos que liderança ou supervisão trouxeram ao cuidado pastoral.",
    empty: "Nenhuma célula com encaminhamento ao pastor nesse recorte.",
  },
  [FILTER_SUPPORT]: {
    title: "Células com pedido de apoio",
    detail: "Pedidos enviados à supervisão, reunidos por célula.",
    empty: "Nenhuma célula com pedido de apoio nesse recorte.",
  },
  [FILTER_ATTENTION]: {
    title: "Células que pedem atenção",
    detail: "Atenções locais, cuidado recente ou presença baixa registrada.",
    empty: "Nenhuma célula pedindo atenção nesse recorte.",
  },
  [FILTER_NO_RECENT_PRESENCE]: {
    title: "Células sem presença recente",
    detail: "Células ativas sem presença recente registrada.",
    empty: "Nenhuma célula sem presença recente nesse recorte.",
  },
  [FILTER_STABLE]: {
    title: "Células estáveis",
    detail: "Células sem sinal prioritário e com presença recente registrada.",
    empty: "Nenhuma célula estável nesse recorte.",
  },
};


export function teamFilterBackHref(filter: TeamFilter) {
  return filter === FILTER_ALL ? ROUTES.team : ROUTES.teamFilter(filter);
}

export function teamGroupHref(groupId: string, activeFilter: TeamFilter = FILTER_ALL) {
  const focus = teamFilterToGroupFocus(activeFilter);

  if (!focus) return ROUTES.group(groupId);

  return routeWithQuery(ROUTES.group(groupId), {
    from: "equipe",
    filtro: activeFilter,
    foco: focus,
  });
}

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

export function groupMatchesQuery(group: TeamGroup, normalizedQuery: string) {
  return matchesNormalizedQuery(`${group.name} ${group.leadershipName}`, normalizedQuery);
}

export function supervisorMatchesQuery(supervisor: SupervisorTeam, normalizedQuery: string) {
  return matchesNormalizedQuery(`${supervisor.name} ${supervisor.email}`, normalizedQuery);
}

export function inactiveGroupMatchesQuery(group: InactiveTeamGroup, normalizedQuery: string) {
  return matchesNormalizedQuery(`${group.name} ${group.locationName ?? ""}`, normalizedQuery);
}

export function groupMatchesFilter(group: TeamGroup, filter: TeamFilter) {
  const statusKey = filterToStatusKey[filter];
  if (statusKey) return groupPastoralStatusKey(group) === statusKey;
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
    supportRequestsCount: groups.reduce((total, group) => total + group.supportRequestsCount, 0),
    localAttentionCount: groups.reduce((total, group) => total + group.localAttentionCount, 0),
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
    if (filter === FILTER_ALL && supervisorMatchesQuery(supervisor, normalizedQuery)) {
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
    filteredInactiveGroups: activeFilter === FILTER_ALL
      ? inactiveGroups.filter((group) => inactiveGroupMatchesQuery(group, normalizedQuery))
      : [],
    isFiltered: Boolean(normalizedQuery) || activeFilter !== FILTER_ALL,
  };
}

export function compactGroupSubtitle(group: TeamGroup) {
  const membersLabel = countLabel(group.membersCount, "membro", "membros");
  return `${group.leadershipName} · ${membersLabel}`;
}

export function groupBadgeTone(group: TeamGroup): SignalBadgeTone {
  if (group.urgentCount > 0 || group.pastoralCasesCount > 0) return "risk";
  if (group.supportRequestsCount > 0) return "support";
  if (group.localAttentionCount > 0 || hasLowPresence(group)) return "warn";
  if (group.inCareCount > 0) return "care";
  if (!group.hasPresenceData) return "neutral";
  return "ok";
}

export function shouldShowGroupBadge(group: TeamGroup) {
  return group.statusLabel !== "Estável";
}

export function supervisorSummary(supervisor: SupervisorTeam) {
  const groupsLabel = countLabel(supervisor.groups.length, "célula acompanhada", "células acompanhadas");

  if (supervisor.urgentCount > 0) {
    return `${groupsLabel} · ${countLabel(supervisor.urgentCount, "urgente", "urgentes")}.`;
  }

  if (supervisor.pastoralCasesCount > 0) {
    return `${groupsLabel} · ${countLabel(supervisor.pastoralCasesCount, "encaminhado", "encaminhados")}.`;
  }

  if (supervisor.supportRequestsCount > 0) {
    return `${groupsLabel} · ${countLabel(supervisor.supportRequestsCount, "pedido de apoio", "pedidos de apoio")}.`;
  }

  if (supervisor.groupsNeedingAttentionCount > 0) {
    return `${groupsLabel} · ${countLabel(supervisor.groupsNeedingAttentionCount, "célula pede", "células pedem")} atenção.`;
  }

  if (supervisor.groupsWithoutPresenceCount > 0) {
    return `${groupsLabel} · ${supervisor.groupsWithoutPresenceCount} sem presença recente.`;
  }

  return groupsLabel;
}

export function supervisorBadgeTone(supervisor: SupervisorTeam): SignalBadgeTone {
  if (supervisor.urgentCount > 0 || supervisor.pastoralCasesCount > 0) return "risk";
  if (supervisor.supportRequestsCount > 0) return "support";
  if (supervisor.localAttentionCount > 0 || supervisor.lowPresenceGroupsCount > 0) return "warn";
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

export function teamFilterContent(filter: TeamFilter) {
  return teamFilterCopy[filter];
}

export function teamNavIndicator(summary: TeamOverview["summary"]) {
  if (summary.urgentCount > 0 || summary.pastoralCasesCount > 0) return "risk" as const;
  if (summary.groupsNeedingAttentionCount > 0) return "attention" as const;
  return undefined;
}
