import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { SectionTitle } from "@/components/base-cards";
import { MemberPriorityList } from "@/components/member-priority-list";
import { SearchBox } from "@/components/search-box";
import { getPeoplePageData } from "@/app/(app)/pessoas/page-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";

type PeoplePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PeoplePage({ searchParams }: PeoplePageProps) {
  const user = await getCurrentUser();
  const queryParams = searchParams ? await searchParams : {};
  const { activeMembersFilter, peopleView } = await getPeoplePageData(user, queryParams);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: peopleView.navIndicator })}
      headerVariant="compact"
    >
      <SearchBox placeholder="Buscar membro..." />

      <section id="membros" className="scroll-mt-6">
        <SectionTitle detail={peopleView.membersSectionDetail}>Membros da célula</SectionTitle>
        <MemberPriorityList
          basePath={ROUTES.people}
          activeFilter={activeMembersFilter}
          priorityMembers={peopleView.priorityMembers}
          regularMembers={peopleView.regularMembers}
          keyForMember={(member) => member.id}
          hrefForMember={(member) => ROUTES.person(member.id)}
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
