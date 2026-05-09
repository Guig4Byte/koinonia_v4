import { PersonStatus, UserRole } from "@/generated/prisma/client";
import { weekdayLabel } from "@/features/groups/weekdays";
import { type BadgeTone } from "@/components/ui/badge";
import { memberCardTone, memberMatchesFilter, type MembersFilter } from "@/features/people/member-filters";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { escalationStatusDetailForViewer } from "@/features/signals/escalation";
import { signalDetailForViewer, type SignalBadgeTone, type SignalDetailLike, type SignalDisplayViewerLike } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase, type SectionSignalWithIdentity } from "@/features/signals/sections";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";

export const GROUP_MEMBER_ATTENTION_MAX_PRIORITY = 4;
export const GROUP_REGULAR_MEMBER_INITIAL_COUNT = 5;
export const GROUP_REGULAR_MEMBER_STEP = 5;
export const GROUP_DETAIL_EVENT_HISTORY_LIMIT = 12;

export type GroupDetailViewer = SignalDisplayViewerLike & {
  id: string;
  role: UserRole;
};

export type GroupDetailSignal = SectionSignalWithIdentity & SignalDetailLike;

export type GroupDetailMembership = {
  id: string;
  personId: string;
  person: {
    fullName: string;
    status: PersonStatus;
  };
};

export type MemberDisplay = {
  membershipId: string;
  personId: string;
  name: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  cardTone?: SignalBadgeTone | "stable" | "muted";
  priorityRank: number;
  status: PersonStatus;
};

export type GroupMembersView = {
  members: MemberDisplay[];
  visibleMembers: MemberDisplay[];
  priorityMembers: MemberDisplay[];
  regularMembers: MemberDisplay[];
  sectionDetail: string;
};

export function groupMeetingText(day?: number | null, time?: string | null) {
  if (day === null || day === undefined) return time ? `Horário: ${time}` : "Encontro sem horário fixo informado.";
  return `${weekdayLabel(day)}${time ? ` · ${time}` : ""}`;
}

export function groupPastoralPulse({
  role,
  urgentOrPastoralCount,
  supportCount,
  localAttentionCount,
  inCareCount,
  hasRecentPresence,
  presenceRate,
  hasPendingEvent,
}: {
  role: UserRole;
  urgentOrPastoralCount: number;
  supportCount: number;
  localAttentionCount: number;
  inCareCount: number;
  hasRecentPresence: boolean;
  presenceRate: number;
  hasPendingEvent: boolean;
}): PastoralPulseMessage {
  return buildPastoralPulseMessage({
    viewerRole: role,
    scope: "groupDetail",
    counts: {
      urgentOrPastoral: urgentOrPastoralCount,
      support: supportCount,
      attention: localAttentionCount,
      inCare: inCareCount,
      hasRecentPresence,
      presenceRate,
      hasPendingEvent,
    },
  });
}

export function groupMemberPriorityRank(signal: GroupDetailSignal | undefined, personStatus: PersonStatus, viewer: GroupDetailViewer) {
  if (signal && isUrgentOrPastoralCase(signal)) return 1;
  if (signal && isSupportRequest(signal, viewer)) return 2;
  if (signal) return 3;
  if (personStatus === PersonStatus.COOLING_AWAY) return 4;
  if (personStatus === PersonStatus.ACTIVE) return 5;
  return 6;
}

export function buildGroupMemberDisplays({
  memberships,
  attentionSignalsByPersonId,
  viewer,
}: {
  memberships: GroupDetailMembership[];
  attentionSignalsByPersonId: ReadonlyMap<string, GroupDetailSignal>;
  viewer: GroupDetailViewer;
}): MemberDisplay[] {
  return memberships
    .map((membership) => {
      const attentionSignal = attentionSignalsByPersonId.get(membership.personId);
      const memberBadge = personEffectiveBadgeForViewer(membership.person, attentionSignal, viewer);
      const escalationSubtitle = attentionSignal ? escalationStatusDetailForViewer(attentionSignal, viewer) : null;
      const signalSubtitle = attentionSignal ? escalationSubtitle ?? signalDetailForViewer(attentionSignal, viewer) : undefined;
      const subtitle = signalSubtitle
        ?? (membership.person.status === PersonStatus.COOLING_AWAY ? "Em cuidado" : undefined);

      return {
        membershipId: membership.id,
        personId: membership.personId,
        name: membership.person.fullName,
        subtitle,
        badgeLabel: memberBadge.label,
        badgeTone: memberBadge.tone,
        cardTone: memberCardTone(memberBadge.tone),
        priorityRank: groupMemberPriorityRank(attentionSignal, membership.person.status, viewer),
        status: membership.person.status,
      };
    })
    .sort(compareGroupMembers);
}

export function compareGroupMembers(left: MemberDisplay, right: MemberDisplay) {
  const priorityDifference = left.priorityRank - right.priorityRank;
  if (priorityDifference !== 0) return priorityDifference;
  return left.name.localeCompare(right.name, "pt-BR");
}

export function groupMembersSectionDetail({
  totalCount,
  priorityCount,
  visibleCount,
  activeFilter,
}: {
  totalCount: number;
  priorityCount: number;
  visibleCount: number;
  activeFilter: MembersFilter;
}) {
  if (activeFilter === "todos") {
    return `${totalCount} ${totalCount === 1 ? "membro" : "membros"}${priorityCount > 0 ? ` · ${priorityCount} em atenção` : ""}`;
  }

  return `${visibleCount} ${visibleCount === 1 ? "pessoa neste recorte" : "pessoas neste recorte"}`;
}

export function buildGroupMembersView(members: MemberDisplay[], activeFilter: MembersFilter): GroupMembersView {
  const visibleMembers = members.filter((member) => memberMatchesFilter(member, activeFilter, {
    attentionMaxPriorityRank: GROUP_MEMBER_ATTENTION_MAX_PRIORITY,
  }));
  const priorityMembers = members.filter((member) => member.priorityRank <= GROUP_MEMBER_ATTENTION_MAX_PRIORITY);
  const activeMembers = members.filter((member) => member.priorityRank > GROUP_MEMBER_ATTENTION_MAX_PRIORITY);
  const regularMembers = activeFilter === "todos" ? activeMembers : visibleMembers;

  return {
    members,
    visibleMembers,
    priorityMembers,
    regularMembers,
    sectionDetail: groupMembersSectionDetail({
      totalCount: members.length,
      priorityCount: priorityMembers.length,
      visibleCount: visibleMembers.length,
      activeFilter,
    }),
  };
}
