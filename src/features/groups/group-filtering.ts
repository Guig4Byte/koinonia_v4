import {
  groupLocalAttentionCount,
  groupPastoralEscalatedCount,
  groupPastoralStatusKey,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
  hasNoRecentPresence,
  type GroupPastoralPriorityInput,
} from "@/features/groups/group-pastoral-priority";
import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_PRESENCE,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";

type SupervisorGroupsFilter =
  | typeof FILTER_ALL
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_PRESENCE
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE;

type TeamGroupsFilter =
  | typeof FILTER_ALL
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_STABLE;

/**
 * Filtro da visão do supervisor em `/celulas`.
 *
 * A supervisão separa explicitamente atenção local, cuidado e presença, por isso
 * `atencao`, `em-cuidado` e `presenca` não são equivalentes neste contexto.
 */
export function matchesSupervisorGroupFilter(
  group: GroupPastoralPriorityInput,
  filter: SupervisorGroupsFilter,
) {
  if (filter === FILTER_URGENT) return groupUrgentCount(group) > 0;
  if (filter === FILTER_PASTORAL) return groupPastoralEscalatedCount(group) > 0;
  if (filter === FILTER_SUPPORT) return groupSupportRequestsCount(group) > 0;
  if (filter === FILTER_ATTENTION) return groupLocalAttentionCount(group) > 0;
  if (filter === FILTER_IN_CARE) return (group.inCareCount ?? 0) > 0;
  if (filter === FILTER_PRESENCE)
    return hasNoRecentPresence(group) || hasLowPresence(group);
  if (filter === FILTER_NO_RECENT_PRESENCE) return hasNoRecentPresence(group);
  if (filter === FILTER_LOW_PRESENCE) return hasLowPresence(group);

  return true;
}

/**
 * Filtro da visão pastoral de equipe em `/equipe`.
 *
 * A equipe usa a classificação pastoral principal da célula; nesse contexto,
 * cuidado em andamento e presença baixa entram em `atencao` porque são frentes
 * que pedem acompanhamento do supervisor responsável.
 */
export function matchesTeamGroupFilter(
  group: GroupPastoralPriorityInput,
  filter: TeamGroupsFilter,
) {
  if (filter === FILTER_ALL) return true;

  const statusKey = groupPastoralStatusKey(group);

  if (filter === FILTER_URGENT) return statusKey === "urgent";
  if (filter === FILTER_PASTORAL) return statusKey === "pastoralCase";
  if (filter === FILTER_SUPPORT) return statusKey === "supportRequest";
  if (filter === FILTER_ATTENTION) return statusKey === "localAttention";
  if (filter === FILTER_NO_RECENT_PRESENCE)
    return statusKey === "withoutRecentPresence";
  if (filter === FILTER_STABLE) return statusKey === "stable";

  return true;
}
