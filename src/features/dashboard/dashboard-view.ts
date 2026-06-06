import { GroupResponsibilityRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { isPresenceRecordedEvent, splitPresenceTrendSamples, summarizeEventsPresence, summarizePresenceTrend, type PresenceEvent } from "@/features/events/presence-summary";
import {
  groupLocalAttentionCount,
  groupPastoralCasesCount,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
  groupNeedsTeamAttention,
  teamGroupPastoralPriorityScore,
  teamGroupStatusLabel,
} from "@/features/groups/group-pastoral-priority";
import { FALLBACK_LEADER_NAME } from "@/features/groups/group-display";
import { responsibilityNames } from "@/features/groups/responsibility-display";
import { isInCarePerson } from "@/features/people/person-status";
import { getPastoralSectionSignalsByPerson, isSupportRequest } from "@/features/signals/sections";
import { getPrimarySignalsByPerson, type AttentionSignalLike } from "@/features/signals/attention";
import type { PermissionUser } from "@/features/permissions/permissions";
import { compareByName, comparePtBr } from "@/lib/text";

export { compareByName } from "@/lib/text";

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

type SupervisorProfile = {
  id: string;
  name: string;
  email: string;
};

export function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
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

function buildGroupPastoralSignalSummary(signals: DashboardSignal[], presence: { hasPresenceData: boolean; presenceRate: number }) {
  const primarySignals = getPrimarySignalsByPerson(signals);
  const countInput = {
    signals: primarySignals,
    hasPresenceData: presence.hasPresenceData,
    presenceRate: presence.presenceRate,
  };
  const urgentCount = groupUrgentCount(countInput);
  const pastoralCasesCount = groupPastoralCasesCount(countInput);
  const supportRequestsCount = groupSupportRequestsCount(countInput);
  const attentionCount = primarySignals.length;
  const localAttentionCount = groupLocalAttentionCount({
    ...countInput,
    urgentCount,
    pastoralCasesCount,
    supportRequestsCount,
    attentionCount,
  });

  return {
    attentionCount,
    pastoralCasesCount,
    supportRequestsCount,
    localAttentionCount,
    urgentCount,
  };
}

export function buildPastorTeamGroup(group: DashboardTeamGroup) {
  const presence = summarizeEventsPresence(group.events);
  const signalSummary = buildGroupPastoralSignalSummary(group.signals, presence);
  const inCareCount = group.memberships.filter((membership) => isInCarePerson(membership.person)).length;
  const hasLowPresenceValue = hasLowPresence(presence);
  const hasNoPresenceData = !presence.hasPresenceData;
  const pastoralPriorityScore = teamGroupPastoralPriorityScore({
    ...signalSummary,
    inCareCount,
    hasPresenceData: presence.hasPresenceData,
    presenceRate: presence.presenceRate,
  });
  const statusLabel = teamGroupStatusLabel({
    ...signalSummary,
    inCareCount,
    hasNoPresenceData,
    hasLowPresence: hasLowPresenceValue,
  });

  return {
    id: group.id,
    name: group.name,
    leadershipName: responsibilityNames(group.responsibilities, GroupResponsibilityRole.LEADER, FALLBACK_LEADER_NAME),
    membersCount: group.memberships.length,
    presenceRate: presence.presenceRate,
    hasPresenceData: presence.hasPresenceData,
    hasLowPresence: hasLowPresenceValue,
    hasNoPresenceData,
    ...signalSummary,
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

function buildSupervisorDisplayName(supervisors: SupervisorProfile[]) {
  if (supervisors.length <= 1) return supervisors[0]?.name ?? "Supervisor";

  const names = supervisors.map((supervisor) => supervisor.name);
  const lastName = names.at(-1);
  const previousNames = names.slice(0, -1);

  return `${previousNames.join(", ")} e ${lastName}`;
}

function buildSupervisorDisplayEmail(supervisors: SupervisorProfile[]) {
  return supervisors.map((supervisor) => supervisor.email).join(" / ");
}

function buildSupervisorTeamFromGroups<TGroup extends DashboardTeamGroup>({
  supervisor,
  supervisorGroups,
}: {
  supervisor: SupervisorProfile;
  supervisorGroups: TGroup[];
}) {
  const groups = mergeGroupsById([supervisorGroups]).map(buildPastorTeamGroup).sort(comparePastoralPriorityThenName);
  const highestPriorityScore = groups[0]?.pastoralPriorityScore ?? 0;
  const groupsNeedingAttentionCount = groups.filter(groupNeedsTeamAttention).length;

  return {
    id: supervisor.id,
    name: supervisor.name,
    email: supervisor.email,
    groups,
    highestPriorityScore,
    groupsNeedingAttentionCount,
    pastoralCasesCount: sumBy(groups, (group) => group.pastoralCasesCount),
    urgentCount: sumBy(groups, (group) => group.urgentCount),
    supportRequestsCount: sumBy(groups, (group) => group.supportRequestsCount),
    localAttentionCount: sumBy(groups, (group) => group.localAttentionCount),
    attentionCount: sumBy(groups, (group) => group.attentionCount),
    groupsWithoutPresenceCount: countGroupsWithoutPresence(groups),
    lowPresenceGroupsCount: countLowPresenceGroups(groups),
  };
}

export function buildSupervisorTeam<TGroup extends DashboardTeamGroup>({
  supervisor,
  groups: supervisorGroups,
}: {
  supervisor: SupervisorProfile;
  groups: TGroup[];
}) {
  return buildSupervisorTeamFromGroups({ supervisor, supervisorGroups });
}

export function mergeSupervisorTeamsBySharedGroups<TTeam extends ReturnType<typeof buildSupervisorTeam>>(teams: TTeam[]): TTeam[] {
  const groupedTeams = new Map<string, TTeam[]>();
  const ungroupedTeams: TTeam[] = [];

  for (const team of teams) {
    if (team.groups.length === 0) {
      ungroupedTeams.push(team);
      continue;
    }

    const groupKey = team.groups.map((group) => group.id).sort(comparePtBr).join("|");
    const currentTeams = groupedTeams.get(groupKey) ?? [];
    currentTeams.push(team);
    groupedTeams.set(groupKey, currentTeams);
  }

  const mergedTeams = Array.from(groupedTeams.values()).map((teamsWithSameGroups) => {
    if (teamsWithSameGroups.length === 1) return teamsWithSameGroups[0];

    const supervisors = teamsWithSameGroups
      .map((team) => ({ id: team.id, name: team.name, email: team.email }));
    const groups = mergeGroupsById(teamsWithSameGroups.map((team) => team.groups)).sort(comparePastoralPriorityThenName);
    const highestPriorityScore = groups[0]?.pastoralPriorityScore ?? 0;

    return {
      ...teamsWithSameGroups[0],
      id: supervisors.map((supervisor) => supervisor.id).join("+"),
      name: buildSupervisorDisplayName(supervisors),
      email: buildSupervisorDisplayEmail(supervisors),
      groups,
      highestPriorityScore,
      groupsNeedingAttentionCount: groups.filter(groupNeedsTeamAttention).length,
      pastoralCasesCount: sumBy(groups, (group) => group.pastoralCasesCount),
      urgentCount: sumBy(groups, (group) => group.urgentCount),
      supportRequestsCount: sumBy(groups, (group) => group.supportRequestsCount),
      localAttentionCount: sumBy(groups, (group) => group.localAttentionCount),
      attentionCount: sumBy(groups, (group) => group.attentionCount),
      groupsWithoutPresenceCount: countGroupsWithoutPresence(groups),
      lowPresenceGroupsCount: countLowPresenceGroups(groups),
    } as TTeam;
  });

  return [...mergedTeams, ...ungroupedTeams];
}

export function buildScopedGroupDashboardItem<TGroup extends DashboardTeamGroup>(group: TGroup, user: PermissionUser, now = new Date()) {
  const recordedGroupEvents = group.events.filter((event) => event.startsAt <= now && isPresenceRecordedEvent(event));
  const { recentItems: recentGroupEvents, previousItems: previousGroupEvents } = splitPresenceTrendSamples(recordedGroupEvents);
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
    inCareCount: group.memberships.filter((membership) => isInCarePerson(membership.person)).length,
  };
}
