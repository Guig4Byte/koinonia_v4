import { PersonStatus, UserRole } from "@/generated/prisma/client";
import { memberCardTone, memberMatchesFilter, type MembersFilter } from "@/features/people/member-filters";
import { isInCareStatus } from "@/features/people/person-status";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { signalTitleForViewer, type SignalBadgeTone, type SignalDetailLike } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase, type SectionSignalWithIdentity } from "@/features/signals/sections";
import { countLabel } from "@/lib/format";
import { FILTER_ALL } from "@/lib/filter-param";
import { compareByName } from "@/lib/text";

export const PEOPLE_PAGE_ATTENTION_SIGNAL_QUERY_LIMIT = 80;
export const PEOPLE_PAGE_VISIBLE_MEMBER_QUERY_LIMIT = 80;
export const PEOPLE_PAGE_IN_CARE_QUERY_LIMIT = 40;
export const PEOPLE_PAGE_PRIMARY_MEMBERSHIP_LIMIT = 1;

export type PeoplePageMemberDisplay = {
  id: string;
  name: string;
  context: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: SignalBadgeTone;
  cardTone?: SignalBadgeTone | "muted";
  status: PersonStatus;
  priorityRank: number;
};

export type PeoplePagePerson = {
  id: string;
  fullName: string;
  status: PersonStatus;
  memberships: Array<{ group?: { name?: string | null } | null }>;
};

export type PeoplePageSignal = SectionSignalWithIdentity & SignalDetailLike;

export type PeoplePageViewer = {
  id: string;
  role: UserRole;
};

export type PeoplePageView = {
  navIndicator?: "attention" | "care";
  members: PeoplePageMemberDisplay[];
  priorityMembers: PeoplePageMemberDisplay[];
  regularMembers: PeoplePageMemberDisplay[];
  membersSectionDetail: string;
};

const memberFilterOptions = {
  attentionMaxPriorityRank: 3,
  inCarePriorityRank: 4,
};

export function peoplePageNavIndicator({
  attentionCount,
  inCareCount,
}: {
  attentionCount: number;
  inCareCount: number;
}): PeoplePageView["navIndicator"] {
  if (attentionCount > 0) return "attention";
  if (inCareCount > 0) return "care";
  return undefined;
}

export function memberPriorityRank({
  signal,
  personStatus,
  isInCare,
  viewer,
}: {
  signal?: PeoplePageSignal | null;
  personStatus: PersonStatus;
  isInCare: boolean;
  viewer: PeoplePageViewer;
}): number {
  if (signal && isUrgentOrPastoralCase(signal)) return 1;
  if (signal && isSupportRequest(signal, viewer)) return 2;
  if (signal) return 3;
  if (isInCare || isInCareStatus(personStatus)) return 4;
  return 5;
}

export function buildPeoplePageMembers({
  people,
  attentionSignals,
  inCarePeople,
  viewer,
}: {
  people: PeoplePagePerson[];
  attentionSignals: PeoplePageSignal[];
  inCarePeople: Array<{ id: string }>;
  viewer: PeoplePageViewer;
}): PeoplePageMemberDisplay[] {
  const signalByPersonId = new Map(attentionSignals.map((signal) => [signal.personId, signal]));
  const inCarePersonIds = new Set(inCarePeople.map((person) => person.id));

  return people
    .map((person) => {
      const attentionSignal = signalByPersonId.get(person.id);
      const badge = personEffectiveBadgeForViewer(person, attentionSignal, viewer);
      const groupName = person.memberships[0]?.group?.name ?? "Sua célula";
      const isInCare = inCarePersonIds.has(person.id);
      const subtitle = attentionSignal
        ? signalTitleForViewer(attentionSignal, viewer)
        : isInCare
          ? "Já recebeu cuidado e segue no radar."
          : undefined;
      const priorityRank = memberPriorityRank({
        signal: attentionSignal,
        personStatus: person.status,
        isInCare,
        viewer,
      });

      return {
        id: person.id,
        name: person.fullName,
        context: groupName,
        subtitle,
        badgeLabel: badge.label,
        badgeTone: badge.tone,
        cardTone: memberCardTone(badge.tone),
        status: person.status,
        priorityRank,
      };
    })
    .sort(comparePeoplePageMembers);
}

export function comparePeoplePageMembers(left: PeoplePageMemberDisplay, right: PeoplePageMemberDisplay): number {
  const priorityDifference = left.priorityRank - right.priorityRank;
  if (priorityDifference !== 0) return priorityDifference;
  return compareByName(left, right);
}

export function peoplePageMembersSectionDetail({
  activeFilter,
  membersCount,
  priorityMembersCount,
  visibleMembersForFilterCount,
}: {
  activeFilter: MembersFilter;
  membersCount: number;
  priorityMembersCount: number;
  visibleMembersForFilterCount: number;
}): string {
  if (activeFilter !== FILTER_ALL) {
    return countLabel(visibleMembersForFilterCount, "pessoa neste recorte", "pessoas neste recorte");
  }

  const totalLabel = countLabel(membersCount, "membro", "membros");
  return priorityMembersCount > 0 ? `${totalLabel} · ${priorityMembersCount} no radar` : totalLabel;
}

export function buildPeoplePageView({
  people,
  attentionSignals,
  inCarePeople,
  activeFilter,
  viewer,
}: {
  people: PeoplePagePerson[];
  attentionSignals: PeoplePageSignal[];
  inCarePeople: PeoplePagePerson[];
  activeFilter: MembersFilter;
  viewer: PeoplePageViewer;
}): PeoplePageView {
  const members = buildPeoplePageMembers({ people, attentionSignals, inCarePeople, viewer });
  const visibleMembersForFilter = members.filter((member) => memberMatchesFilter(member, activeFilter, memberFilterOptions));
  const priorityMembers = members.filter((member) => member.priorityRank <= 4);
  const activeMembers = members.filter((member) => member.priorityRank >= 5);
  const regularMembers = activeFilter === FILTER_ALL ? activeMembers : visibleMembersForFilter;

  return {
    navIndicator: peoplePageNavIndicator({ attentionCount: attentionSignals.length, inCareCount: inCarePeople.length }),
    members,
    priorityMembers,
    regularMembers,
    membersSectionDetail: peoplePageMembersSectionDetail({
      activeFilter,
      membersCount: members.length,
      priorityMembersCount: priorityMembers.length,
      visibleMembersForFilterCount: visibleMembersForFilter.length,
    }),
  };
}
