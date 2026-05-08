import { GroupResponsibilityRole, PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { isPresenceRecordedEvent, summarizeEventsPresence, summarizePresenceTrend, type PresenceEvent } from "@/features/events/presence-summary";
import {
  hasLowPresence,
  teamGroupPastoralPriorityScore,
  teamGroupStatusLabel,
} from "@/features/groups/group-pastoral-priority";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { getPastoralSectionSignalsByPerson, isSupportRequest } from "@/features/signals/sections";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, type AttentionSignalLike } from "@/features/signals/attention";
import type { PermissionUser } from "@/features/permissions/permissions";

const PT_BR_LOCALE = "pt-BR";

export type DashboardResponsibility = {
  role: GroupResponsibilityRole;
  user: { name: string };
};

export type DashboardSignal = AttentionSignalLike & {
  id: string;
  assignedTo?: { role: UserRole } | null;
};

export type DashboardEvent = PresenceEvent & { startsAt: Date };

export type DashboardGroupBase = {
  id: string;
  name: string;
  leader?: { name: string } | null;
  supervisor?: { name: string } | null;
  responsibilities: DashboardResponsibility[];
  signals: DashboardSignal[];
  events: DashboardEvent[];
};

export type DashboardTeamGroup = DashboardGroupBase & {
  memberships: { person: { status: PersonStatus } }[];
};

export type PastoralPriorityItem = {
  name: string;
  pastoralPriorityScore: number;
};

export type SupervisorPriorityItem = {
  name: string;
  highestPriorityScore: number;
  groupsNeedingAttentionCount: number;
};

export function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

export function compareByName<T extends { name: string }>(left: T, right: T) {
  return left.name.localeCompare(right.name, PT_BR_LOCALE);
}

export function comparePastoralPriorityThenName<T extends PastoralPriorityItem>(left: T, right: T) {
  const scoreDifference = right.pastoralPriorityScore - left.pastoralPriorityScore;
  if (scoreDifference !== 0) return scoreDifference;

  return compareByName(left, right);
}

export function compareSupervisorPriority(left: SupervisorPriorityItem, right: SupervisorPriorityItem) {
  const scoreDifference = right.highestPriorityScore - left.highestPriorityScore;
  if (scoreDifference !== 0) return scoreDifference;

  const attentionDifference = right.groupsNeedingAttentionCount - left.groupsNeedingAttentionCount;
  if (attentionDifference !== 0) return attentionDifference;

  return compareByName(left, right);
}

export function countGroupsWithoutPresence<T extends { hasPresenceData: boolean }>(groups: T[]) {
  return groups.filter((group) => !group.hasPresenceData).length;
}

export function countLowPresenceGroups<T extends { hasPresenceData: boolean; presenceRate: number }>(groups: T[]) {
  return groups.filter(hasLowPresence).length;
}

export function buildPastorGroupPresence(group: DashboardGroupBase) {
  const groupPresence = summarizeEventsPresence(group.events);
  const recordedEvents = group.events.filter(isPresenceRecordedEvent);
  const primarySignals = getPrimarySignalsByPerson(group.signals);
  const pastoralSignals = getPastoralSignalsByPerson(group.signals);

  return {
    id: group.id,
    name: group.name,
    leaderName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "Sem liderança"),
    supervisorName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.SUPERVISOR, group.supervisor?.name ?? "Sem supervisão"),
    presenceRate: groupPresence.presenceRate,
    hasPresenceData: groupPresence.hasPresenceData,
    recordedEventsCount: recordedEvents.length,
    attentionCount: primarySignals.length,
    pastoralCasesCount: pastoralSignals.length,
  };
}

export function buildPastorTeamGroup(group: DashboardTeamGroup) {
  const presence = summarizeEventsPresence(group.events);
  const primarySignals = getPrimarySignalsByPerson(group.signals);
  const pastoralSignals = getPastoralSignalsByPerson(group.signals);
  const urgentCount = pastoralSignals.filter((signal) => signal.severity === SignalSeverity.URGENT).length;
  const supportRequestsCount = primarySignals.filter((signal) => signal.assignedTo?.role === UserRole.SUPERVISOR).length;
  const pastoralCasesCount = pastoralSignals.length;
  const attentionCount = primarySignals.length;
  const localAttentionCount = Math.max(attentionCount - pastoralCasesCount - supportRequestsCount, 0);
  const inCareCount = group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length;
  const hasLowPresenceValue = hasLowPresence(presence);
  const hasNoPresenceData = !presence.hasPresenceData;
  const pastoralPriorityScore = teamGroupPastoralPriorityScore({
    urgentCount,
    pastoralCasesCount,
    hasPresenceData: presence.hasPresenceData,
    presenceRate: presence.presenceRate,
  });
  const statusLabel = teamGroupStatusLabel({
    urgentCount,
    pastoralCasesCount,
    hasNoPresenceData,
    hasLowPresence: hasLowPresenceValue,
  });

  return {
    id: group.id,
    name: group.name,
    leadershipName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, group.leader?.name ?? "não informada"),
    membersCount: group.memberships.length,
    presenceRate: presence.presenceRate,
    hasPresenceData: presence.hasPresenceData,
    hasLowPresence: hasLowPresenceValue,
    hasNoPresenceData,
    attentionCount,
    pastoralCasesCount,
    supportRequestsCount,
    localAttentionCount,
    urgentCount,
    inCareCount,
    pastoralPriorityScore,
    statusLabel,
  };
}

export function mergeGroupsById<T extends { id: string }>(groups: T[][]) {
  const groupsById = new Map<string, T>();

  groups.flat().forEach((group) => {
    if (!groupsById.has(group.id)) {
      groupsById.set(group.id, group);
    }
  });

  return Array.from(groupsById.values());
}

export function buildSupervisorTeam<TGroup extends DashboardTeamGroup>({
  supervisor,
  responsibilityGroups,
  legacyGroups,
}: {
  supervisor: { id: string; name: string; email: string };
  responsibilityGroups: TGroup[];
  legacyGroups: TGroup[];
}) {
  const groups = mergeGroupsById([responsibilityGroups, legacyGroups]).map(buildPastorTeamGroup).sort(comparePastoralPriorityThenName);
  const highestPriorityScore = groups[0]?.pastoralPriorityScore ?? 0;
  const groupsNeedingAttentionCount = groups.filter((group) => group.pastoralPriorityScore > 0).length;

  return {
    id: supervisor.id,
    name: supervisor.name,
    email: supervisor.email,
    groups,
    highestPriorityScore,
    groupsNeedingAttentionCount,
    pastoralCasesCount: sumBy(groups, (group) => group.pastoralCasesCount),
    urgentCount: sumBy(groups, (group) => group.urgentCount),
    attentionCount: sumBy(groups, (group) => group.attentionCount),
    groupsWithoutPresenceCount: countGroupsWithoutPresence(groups),
    lowPresenceGroupsCount: countLowPresenceGroups(groups),
  };
}

export function buildScopedGroupDashboardItem<TGroup extends DashboardTeamGroup>(group: TGroup, user: PermissionUser, now = new Date()) {
  const recordedGroupEvents = group.events.filter((event) => event.startsAt <= now && isPresenceRecordedEvent(event));
  const recentGroupEvents = recordedGroupEvents.slice(0, 4);
  const previousGroupEvents = recordedGroupEvents.slice(4, 8);
  const groupPresence = summarizeEventsPresence(recentGroupEvents);
  const previousGroupPresence = summarizeEventsPresence(previousGroupEvents);
  const groupAttentionSignals = getPastoralSectionSignalsByPerson(group.signals, user);

  return {
    ...group,
    presenceRate: groupPresence.presenceRate,
    hasPresenceData: groupPresence.hasPresenceData,
    presenceTrend: summarizePresenceTrend(groupPresence, previousGroupPresence),
    recordedEventsCount: recordedGroupEvents.length,
    attentionCount: groupAttentionSignals.length,
    supportRequestsCount: groupAttentionSignals.filter((signal) => isSupportRequest(signal, user)).length,
    inCareCount: group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length,
  };
}
