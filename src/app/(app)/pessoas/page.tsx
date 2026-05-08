import { redirect } from "next/navigation";
import { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { SectionTitle } from "@/components/cards";
import { MemberPriorityList } from "@/components/member-priority-list";
import { SearchBox } from "@/components/search-box";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { memberCardTone, memberMatchesFilter, readMembersFilter } from "@/features/people/member-filters";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { signalDetailForViewer, type SignalBadgeTone } from "@/features/signals/display";
import { isSupportRequest, isUrgentOrPastoralCase, splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/text";
import { firstParam } from "@/lib/search-params";

type PeoplePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type MemberDisplay = {
  id: string;
  name: string;
  initials: string;
  context: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: SignalBadgeTone;
  cardTone?: SignalBadgeTone | "muted";
  status: PersonStatus;
  priorityRank: number;
};

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const user = await getCurrentUser();
  const queryParams = searchParams ? await searchParams : {};
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));

  if (user.role === UserRole.SUPERVISOR) {
    redirect("/celulas");
  }

  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    redirect("/equipe");
  }

  const memberMembershipWhere = {
    ...getVisibleMembershipWhere(user),
    role: { not: MembershipRole.VISITOR },
  };

  const [openSignals, visibleMembers, inCarePeople] = await Promise.all([
    prisma.careSignal.findMany({
      where: getVisibleOpenSignalWhere(user),
      include: { person: true, assignedTo: true, group: { include: { leader: true } } },
      orderBy: { detectedAt: "desc" },
      take: 80,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
      take: 80,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { status: PersonStatus.COOLING_AWAY },
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
  ]);

  const pastoralSections = splitPastoralSections({
    signals: openSignals,
    inCarePeople,
    viewer: user,
  });
  const attentionPeople = [
    ...pastoralSections.urgentOrPastoralCases,
    ...pastoralSections.supportRequests,
    ...pastoralSections.localAttention,
  ];
  const navIndicator = attentionPeople.length > 0
    ? "attention"
    : pastoralSections.inCarePeople.length > 0
      ? "care"
      : undefined;
  const attentionSignalByPersonId = new Map(attentionPeople.map((signal) => [signal.personId, signal]));
  const inCarePersonIds = new Set(pastoralSections.inCarePeople.map((person) => person.id));

  const members: MemberDisplay[] = visibleMembers
    .map((person) => {
      const attentionSignal = attentionSignalByPersonId.get(person.id);
      const badge = personEffectiveBadgeForViewer(person, attentionSignal, user);
      const groupName = person.memberships[0]?.group.name ?? "Sua célula";
      const subtitle = attentionSignal
        ? signalDetailForViewer(attentionSignal, user)
        : inCarePersonIds.has(person.id)
          ? "Já recebeu cuidado e segue no radar."
          : undefined;
      const priorityRank = (() => {
        if (attentionSignal && isUrgentOrPastoralCase(attentionSignal)) return 1;
        if (attentionSignal && isSupportRequest(attentionSignal, user)) return 2;
        if (attentionSignal) return 3;
        if (inCarePersonIds.has(person.id) || person.status === PersonStatus.COOLING_AWAY) return 4;
        return 5;
      })();

      return {
        id: person.id,
        name: person.fullName,
        initials: initials(person.fullName),
        context: groupName,
        subtitle,
        badgeLabel: badge.label,
        badgeTone: badge.tone,
        cardTone: memberCardTone(badge.tone),
        status: person.status,
        priorityRank,
      };
    })
    .sort((left, right) => {
      const priorityDifference = left.priorityRank - right.priorityRank;
      if (priorityDifference !== 0) return priorityDifference;
      return left.name.localeCompare(right.name, "pt-BR");
    });

  const visibleMembersForFilter = members.filter((member) => memberMatchesFilter(member, activeMembersFilter, {
    attentionMaxPriorityRank: 3,
    inCarePriorityRank: 4,
  }));
  const priorityMembers = members.filter((member) => member.priorityRank <= 4);
  const activeMembers = members.filter((member) => member.priorityRank >= 5);
  const regularMembers = activeMembersFilter === "todos" ? activeMembers : visibleMembersForFilter;
  const membersSectionDetail = activeMembersFilter === "todos"
    ? `${members.length} ${members.length === 1 ? "membro" : "membros"}${priorityMembers.length > 0 ? ` · ${priorityMembers.length} no radar` : ""}`
    : `${visibleMembersForFilter.length} ${visibleMembersForFilter.length === 1 ? "pessoa neste recorte" : "pessoas neste recorte"}`;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar membro..." />

      <section id="membros" className="scroll-mt-6">
        <SectionTitle detail={membersSectionDetail}>Membros da célula</SectionTitle>
        <MemberPriorityList
          basePath="/pessoas"
          activeFilter={activeMembersFilter}
          priorityMembers={priorityMembers}
          regularMembers={regularMembers}
          keyForMember={(member) => member.id}
          hrefForMember={(member) => `/pessoas/${member.id}`}
          priorityContextForMember={(member) => member.subtitle ?? member.context}
          filteredContextForMember={(member) => member.priorityRank >= 5 ? undefined : member.subtitle ?? member.context}
          priorityMoreLabel="Ver mais pessoas no radar"
          priorityLessLabel="Mostrar menos pessoas no radar"
          regularInitialCount={6}
          regularStep={6}
        />
      </section>
    </AppShell>
  );
}
