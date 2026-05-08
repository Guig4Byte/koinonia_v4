import { redirect } from "next/navigation";
import { MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { SectionTitle } from "@/components/base-cards";
import { MemberPriorityList } from "@/components/member-priority-list";
import { SearchBox } from "@/components/search-box";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { readMembersFilter } from "@/features/people/member-filters";
import { buildPeoplePageView } from "@/features/people/people-page-view";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";

type PeoplePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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
  const peopleView = buildPeoplePageView({
    people: visibleMembers,
    attentionSignals: attentionPeople,
    inCarePeople: pastoralSections.inCarePeople,
    activeFilter: activeMembersFilter,
    viewer: user,
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: peopleView.navIndicator })}
    >
      <SearchBox placeholder="Buscar membro..." />

      <section id="membros" className="scroll-mt-6">
        <SectionTitle detail={peopleView.membersSectionDetail}>Membros da célula</SectionTitle>
        <MemberPriorityList
          basePath="/pessoas"
          activeFilter={activeMembersFilter}
          priorityMembers={peopleView.priorityMembers}
          regularMembers={peopleView.regularMembers}
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
