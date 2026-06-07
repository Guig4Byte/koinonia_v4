import { memberMatchesFilter, type MembersFilter } from "@/features/people/member-filters";
import { countLabel } from "@/lib/format";
import {
  FILTER_ACTIVE,
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
} from "@/lib/filter-param";
import { groupMemberMatchesFocus } from "@/features/groups/group-detail-view/group-detail-focus";
import {
  GROUP_MEMBER_IN_CARE_PRIORITY,
  GROUP_MEMBER_SIGNAL_MAX_PRIORITY,
} from "@/features/groups/group-detail-view/group-detail-view.constants";
import { type GroupDetailFocus, type GroupMembersView, type MemberDisplay } from "@/features/groups/group-detail-view/group-detail-view.types";

export function groupMembersSectionDetail({
  totalCount,
  priorityCount,
  inCareCount = 0,
  visibleCount,
  activeFilter,
}: {
  totalCount: number;
  priorityCount: number;
  inCareCount?: number;
  visibleCount: number;
  activeFilter: MembersFilter;
}) {
  if (activeFilter === FILTER_ALL) {
    const statusParts = [
      priorityCount > 0 ? countLabel(priorityCount, "sinal aberto", "sinais abertos") : null,
      inCareCount > 0 ? countLabel(inCareCount, "em cuidado", "em cuidado") : null,
    ].filter(Boolean);

    return `${countLabel(totalCount, "membro", "membros")}${statusParts.length > 0 ? ` · ${statusParts.join(" · ")}` : ""}`;
  }

  return countLabel(visibleCount, "irmão neste recorte", "irmãos neste recorte");
}

function groupMemberBuckets(members: MemberDisplay[]) {
  const signalMembers = members.filter((member) => member.priorityRank <= GROUP_MEMBER_SIGNAL_MAX_PRIORITY);
  const inCareMembers = members.filter((member) => member.priorityRank === GROUP_MEMBER_IN_CARE_PRIORITY);
  const activeMembers = members.filter((member) => member.priorityRank > GROUP_MEMBER_IN_CARE_PRIORITY);

  return { signalMembers, inCareMembers, activeMembers };
}

export function resolveGroupMembersInitialFilter(
  members: MemberDisplay[],
  preferredFilter: MembersFilter,
  isExplicitFilter: boolean,
): MembersFilter {
  if (isExplicitFilter) return preferredFilter;

  const { signalMembers, inCareMembers, activeMembers } = groupMemberBuckets(members);
  if (preferredFilter === FILTER_ATTENTION && signalMembers.length === 0) {
    if (inCareMembers.length > 0) return FILTER_IN_CARE;
    if (activeMembers.length > 0) return FILTER_ACTIVE;
  }
  if (preferredFilter === FILTER_IN_CARE && inCareMembers.length === 0 && activeMembers.length > 0) return FILTER_ACTIVE;

  return preferredFilter;
}

export function buildGroupMembersView(
  members: MemberDisplay[],
  activeFilter: MembersFilter,
  activeFocus: GroupDetailFocus | null = null,
): GroupMembersView {
  const visibleMembers = members.filter((member) => memberMatchesFilter(member, activeFilter, {
    attentionMaxPriorityRank: GROUP_MEMBER_SIGNAL_MAX_PRIORITY,
    inCarePriorityRank: GROUP_MEMBER_IN_CARE_PRIORITY,
    activeMinPriorityRank: GROUP_MEMBER_IN_CARE_PRIORITY + 1,
  }));
  const { signalMembers, inCareMembers, activeMembers } = groupMemberBuckets(members);
  const focusedMembers = activeFocus
    ? members.filter((member) => groupMemberMatchesFocus(member, activeFocus))
    : [];
  const priorityMembers = signalMembers;
  const regularMembers = activeFilter === FILTER_ALL ? activeMembers : visibleMembers;

  return {
    members,
    visibleMembers,
    priorityMembers,
    inCareMembers,
    regularMembers,
    filterCounts: {
      [FILTER_ATTENTION]: signalMembers.length,
      [FILTER_IN_CARE]: inCareMembers.length,
      [FILTER_ACTIVE]: activeMembers.length,
    },
    sectionDetail: groupMembersSectionDetail({
      totalCount: members.length,
      priorityCount: signalMembers.length,
      inCareCount: inCareMembers.length,
      visibleCount: visibleMembers.length,
      activeFilter,
    }),
    focusedMembersCount: focusedMembers.length,
  };
}
