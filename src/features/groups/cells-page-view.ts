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
import { joinLabelsPtBr } from "@/lib/list-label";
import type { CellsFilter } from "@/features/groups/cells-page-filters";
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

type GroupCareStatusKey =
  | "urgent"
  | "pastoral"
  | "support"
  | "attention"
  | "care"
  | "noPresence"
  | "lowPresence";

type GroupCareStatusSummary = {
  key: GroupCareStatusKey;
  count: number;
  label: string;
};

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
  if (filter === FILTER_ATTENTION) return groupLocalAttentionCount(group) > 0;
  if (filter === FILTER_IN_CARE) return group.inCareCount > 0;
  if (filter === FILTER_PRESENCE) return !group.hasPresenceData || hasLowPresence(group);
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
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE;

function contextualGroupFocus(group: SupervisorGroup, filter: CellsFilter): GroupDetailNavigationFocus | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) return FILTER_URGENT;
  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) return FILTER_PASTORAL;
  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) return FILTER_SUPPORT;
  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) return FILTER_ATTENTION;
  if (filter === FILTER_IN_CARE && group.inCareCount > 0) return FILTER_IN_CARE;
  if (filter === FILTER_NO_RECENT_PRESENCE && !group.hasPresenceData) return FILTER_NO_RECENT_PRESENCE;
  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) return FILTER_LOW_PRESENCE;

  if (filter === FILTER_PRESENCE) {
    if (!group.hasPresenceData) return FILTER_NO_RECENT_PRESENCE;
    if (hasLowPresence(group)) return FILTER_LOW_PRESENCE;
  }

  return null;
}

function groupCareStatusSummaries(group: SupervisorGroup): GroupCareStatusSummary[] {
  const summaries: GroupCareStatusSummary[] = [
    { key: "urgent", count: groupUrgentCount(group), label: "urgência" },
    { key: "pastoral", count: groupPastoralEscalatedCount(group), label: "encaminhamento" },
    { key: "support", count: groupSupportRequestsCount(group), label: "apoio" },
    { key: "attention", count: groupLocalAttentionCount(group), label: "atenção" },
    { key: "care", count: group.inCareCount, label: "cuidado" },
    { key: "noPresence", count: group.hasPresenceData ? 0 : 1, label: "sem presença recente" },
    { key: "lowPresence", count: hasLowPresence(group) ? 1 : 0, label: "presença baixa" },
  ];

  return summaries.filter((item) => item.count > 0);
}

function groupPrimaryStatusKey(group: SupervisorGroup, filter: CellsFilter): GroupCareStatusKey | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) return "urgent";
  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) return "pastoral";
  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) return "support";
  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) return "attention";
  if (filter === FILTER_IN_CARE && group.inCareCount > 0) return "care";
  if (filter === FILTER_NO_RECENT_PRESENCE && !group.hasPresenceData) return "noPresence";
  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) return "lowPresence";

  if (filter === FILTER_PRESENCE) {
    if (!group.hasPresenceData) return "noPresence";
    if (hasLowPresence(group)) return "lowPresence";
  }

  if (groupUrgentCount(group) > 0) return "urgent";
  if (groupPastoralEscalatedCount(group) > 0) return "pastoral";
  if (groupSupportRequestsCount(group) > 0) return "support";
  if (groupLocalAttentionCount(group) > 0) return "attention";
  if (!group.hasPresenceData) return "noPresence";
  if (hasLowPresence(group)) return "lowPresence";
  if (group.inCareCount > 0) return "care";

  return null;
}

export function groupStatusSummary(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): string | undefined {
  const primaryStatusKey = groupPrimaryStatusKey(group, filter);
  const secondaryStatuses = groupCareStatusSummaries(group).filter((item) => item.key !== primaryStatusKey);

  if (secondaryStatuses.length === 0) return undefined;
  if (secondaryStatuses.length <= 2) return `Também há ${joinLabelsPtBr(secondaryStatuses.map((item) => item.label))}`;

  return `Também há ${secondaryStatuses.length} frentes no radar`;
}

export function groupDetailNavigationFocus(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): GroupDetailNavigationFocus | null {
  const contextualFocus = contextualGroupFocus(group, filter);
  if (contextualFocus) return contextualFocus;

  if (groupUrgentCount(group) > 0) return FILTER_URGENT;
  if (groupPastoralEscalatedCount(group) > 0) return FILTER_PASTORAL;
  if (groupSupportRequestsCount(group) > 0) return FILTER_SUPPORT;
  if (groupLocalAttentionCount(group) > 0) return FILTER_ATTENTION;
  if (group.inCareCount > 0) return FILTER_IN_CARE;
  if (!group.hasPresenceData) return FILTER_NO_RECENT_PRESENCE;
  if (hasLowPresence(group)) return FILTER_LOW_PRESENCE;

  return null;
}

export function groupDetailHref(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL) {
  return routeWithQuery(`/celulas/${group.id}`, { foco: groupDetailNavigationFocus(group, filter) });
}

function contextualGroupBadge(group: SupervisorGroup, filter: CellsFilter): SignalBadge | null {
  if (filter === FILTER_URGENT && groupUrgentCount(group) > 0) {
    return { label: groupAttentionLabel(groupUrgentCount(group), "urgente", "urgentes"), tone: "risk" };
  }

  if (filter === FILTER_PASTORAL && groupPastoralEscalatedCount(group) > 0) {
    return { label: groupAttentionLabel(groupPastoralEscalatedCount(group), "encaminhado", "encaminhados"), tone: "risk" };
  }

  if (filter === FILTER_SUPPORT && groupSupportRequestsCount(group) > 0) {
    return { label: groupAttentionLabel(groupSupportRequestsCount(group), "pedido de apoio", "pedidos de apoio"), tone: "support" };
  }

  if (filter === FILTER_ATTENTION && groupLocalAttentionCount(group) > 0) {
    return { label: groupAttentionLabel(groupLocalAttentionCount(group), "pessoa em atenção", "pessoas em atenção"), tone: "warn" };
  }

  if (filter === FILTER_IN_CARE && group.inCareCount > 0) {
    return { label: groupAttentionLabel(group.inCareCount, "em cuidado", "em cuidado"), tone: "care" };
  }

  if (filter === FILTER_NO_RECENT_PRESENCE && !group.hasPresenceData) {
    return { label: NO_RECENT_PRESENCE_LABEL, tone: "neutral" };
  }

  if (filter === FILTER_LOW_PRESENCE && hasLowPresence(group)) {
    return { label: "Presença baixa", tone: "warn" };
  }

  if (filter === FILTER_PRESENCE) {
    if (!group.hasPresenceData) return { label: NO_RECENT_PRESENCE_LABEL, tone: "neutral" };
    if (hasLowPresence(group)) return { label: "Presença baixa", tone: "warn" };
  }

  return null;
}

export function groupBadge(group: SupervisorGroup, filter: CellsFilter = FILTER_ALL): SignalBadge | null {
  const contextualBadge = contextualGroupBadge(group, filter);
  if (contextualBadge) return contextualBadge;

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

  const localAttention = groupLocalAttentionCount(group);

  if (localAttention > 0) {
    return { label: groupAttentionLabel(localAttention, "pessoa em atenção", "pessoas em atenção"), tone: "warn" };
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
