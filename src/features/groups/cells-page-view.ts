import type { getSupervisorDashboard } from "@/features/dashboard/queries";
import {
  groupNeedsPastoralAttention,
  groupPastoralEscalatedCount,
  groupPastoralPriorityScore,
  groupRiskCount,
  groupUrgentCount,
  groupSupportRequestsCount,
  groupLocalAttentionCount,
  hasLowPresence,
} from "@/features/groups/group-pastoral-priority";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { GroupResponsibilityRole } from "@/generated/prisma/client";
import { groupAttentionLabel, type SignalBadge } from "@/features/signals/display";
import { compareByName, matchesNormalizedQuery, normalizeSearchText } from "@/lib/text";
import { countLabel } from "@/lib/format";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
import {
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_SUPPORT,
  FILTER_URGENT,
  NO_RECENT_PRESENCE_LABEL,
} from "@/lib/filter-param";
import { routeWithQuery } from "@/lib/routes";

export const CELLS_PAGE_SECTION_LIMIT = 4;

export type SupervisorDashboard = Awaited<ReturnType<typeof getSupervisorDashboard>>;
export type SupervisorGroup = SupervisorDashboard["groups"][number];
export type GroupSectionKey = "care" | "presence" | "stable";

export const GROUP_SECTIONS: Array<{ key: GroupSectionKey; title: string; detail: string }> = [
  {
    key: "care",
    title: "Cuidado próximo",
    detail: "Sinais abertos, pedidos de apoio ou pessoas já em cuidado.",
  },
  {
    key: "presence",
    title: "Presença em atenção",
    detail: "Células com registro ausente ou presença abaixo do esperado.",
  },
  {
    key: "stable",
    title: "Acompanhamento estável",
    detail: "Sem sinal aberto pedindo cuidado agora.",
  },
];

export type CellsPageView = {
  groups: SupervisorGroup[];
  groupedSections: Array<{ key: GroupSectionKey; title: string; detail: string; groups: SupervisorGroup[] }>;
  groupsNeedingAttentionCount: number;
  groupsWithoutPresenceCount: number;
  navIndicator?: "risk" | "attention" | "care";
  isFiltered: boolean;
};

export function groupSearchText(group: SupervisorGroup) {
  const leadership = responsibilityNames(
    group.responsibilities,
    GroupResponsibilityRole.LEADER,
    "",
  );

  return normalizeSearchText(`${group.name} ${leadership}`);
}

export function groupLeadershipName(group: SupervisorGroup) {
  return responsibilityNames(
    group.responsibilities,
    GroupResponsibilityRole.LEADER,
    FALLBACK_LEADER_NAME,
  );
}

export function groupSubtitle(group: SupervisorGroup) {
  const membersLabel = countLabel(group.memberships.length, "membro", "membros");
  return `${groupLeadershipName(group)} · ${membersLabel}`;
}

export function groupSectionKey(group: SupervisorGroup): GroupSectionKey {
  if (groupRiskCount(group) > 0 || group.supportRequestsCount > 0 || group.attentionCount > 0 || group.inCareCount > 0) {
    return "care";
  }

  if (!group.hasPresenceData || hasLowPresence(group)) {
    return "presence";
  }

  return "stable";
}

export function compareGroups(left: SupervisorGroup, right: SupervisorGroup) {
  const scoreDifference = groupPastoralPriorityScore(right) - groupPastoralPriorityScore(left);
  if (scoreDifference !== 0) return scoreDifference;

  return compareByName(left, right);
}

export function groupMatchesFilter(group: SupervisorGroup, filter: CellsFilter) {
  if (filter === FILTER_URGENT) return groupUrgentCount(group) > 0;
  if (filter === FILTER_PASTORAL) return groupPastoralEscalatedCount(group) > 0;
  if (filter === FILTER_SUPPORT) return groupSupportRequestsCount(group) > 0;
  if (filter === FILTER_ATTENTION) return groupNeedsPastoralAttention(group);
  if (filter === FILTER_IN_CARE) return group.inCareCount > 0;
  if (filter === FILTER_NO_RECENT_PRESENCE) return !group.hasPresenceData;
  if (filter === FILTER_LOW_PRESENCE) return hasLowPresence(group);
  return true;
}

export function filterCellsPageGroups(groups: SupervisorGroup[], normalizedQuery: string, filter: CellsFilter) {
  return groups
    .filter((group) => groupMatchesFilter(group, filter))
    .filter((group) => matchesNormalizedQuery(groupSearchText(group), normalizedQuery))
    .sort(compareGroups);
}

export type GroupDetailNavigationFocus =
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_NO_RECENT_PRESENCE;

export function groupDetailNavigationFocus(group: SupervisorGroup): GroupDetailNavigationFocus | null {
  if (groupUrgentCount(group) > 0) return FILTER_URGENT;
  if (groupPastoralEscalatedCount(group) > 0) return FILTER_PASTORAL;
  if (groupSupportRequestsCount(group) > 0) return FILTER_SUPPORT;
  if (groupLocalAttentionCount(group) > 0) return FILTER_ATTENTION;
  if (group.inCareCount > 0) return FILTER_IN_CARE;
  if (!group.hasPresenceData) return FILTER_NO_RECENT_PRESENCE;

  return null;
}

export function groupDetailHref(group: SupervisorGroup) {
  return routeWithQuery(`/celulas/${group.id}`, { foco: groupDetailNavigationFocus(group) });
}

export function groupBadge(group: SupervisorGroup): SignalBadge | null {
  const urgent = groupUrgentCount(group);
  const escalated = groupPastoralEscalatedCount(group);

  if (urgent > 0) {
    return { label: groupAttentionLabel(urgent, "urgente", "urgentes"), tone: "risk" };
  }

  if (escalated > 0) {
    return { label: groupAttentionLabel(escalated, "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (group.supportRequestsCount > 0) {
    return { label: groupAttentionLabel(group.supportRequestsCount, "pedido de apoio", "pedidos de apoio"), tone: "support" };
  }

  if (group.attentionCount > 0) {
    return { label: groupAttentionLabel(group.attentionCount, "pessoa em atenção", "pessoas em atenção"), tone: "warn" };
  }

  if (!group.hasPresenceData) {
    return { label: NO_RECENT_PRESENCE_LABEL, tone: "neutral" };
  }

  if (hasLowPresence(group)) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (group.inCareCount > 0) {
    return { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  return null;
}

export function sectionCardTone(sectionKey: GroupSectionKey) {
  if (sectionKey === "presence") return "muted";
  if (sectionKey === "stable") return "stable";
  return undefined;
}

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
