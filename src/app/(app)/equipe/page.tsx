import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, InfoCard, SectionTitle } from "@/components/shared/base-cards";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero } from "@/components/shared/page-hero";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { TeamStructureSearch } from "@/features/team/components/team-structure-search";
import { TeamFilterContextCard, TeamStructureAdjustments, TeamSupervisorCard } from "@/features/team/components/team-structure-cards";
import { GroupKind } from "@/generated/prisma/client";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups, canUsePastorDashboard } from "@/features/permissions/permissions";
import {
  buildTeamPageLists,
  readTeamFilter,
  SUPERVISOR_SECTION_LIMIT,
  SUPERVISORS_SECTION_ID,
  teamFilterContent,
  teamNavIndicator,
  teamSavedMessage,
} from "@/features/team/team-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { normalizeSearchText } from "@/lib/text";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";
import teamCardStyles from "@/features/team/components/team-structure-cards.module.css";

type TeamPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamPage({ searchParams }: TeamPageProps) {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect(ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.q).trim();
  const normalizedQuery = normalizeSearchText(query);
  const activeFilter = readTeamFilter(firstParam(params.filtro));
  const savedParam = firstParam(params.salvo);
  const team = await getPastorTeamOverview(user);
  const inactiveGroups = canManageGroups(user)
    ? await prisma.smallGroup.findMany({
      where: { churchId: user.churchId, kind: GroupKind.CELL, isActive: false },
      select: { id: true, name: true, meetingDayOfWeek: true, meetingTime: true, locationName: true },
      orderBy: { name: "asc" },
    })
    : [];
  const {
    filteredSupervisors,
    filteredUnassignedGroups,
    filteredInactiveGroups,
    isFiltered,
  } = buildTeamPageLists({ team, inactiveGroups, normalizedQuery, activeFilter });
  const canCreateGroup = canManageGroups(user);
  const savedMessage = teamSavedMessage(savedParam);
  const filterContent = teamFilterContent(activeFilter);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: teamNavIndicator(team.summary) })}
      headerVariant="compact"
    >
      <div className={pageStyles.page}>
        <PageHero
          compact
          eyebrow="Equipe pastoral"
          title="Equipe"
          description="Supervisores e células por atenção pastoral."
          action={canCreateGroup ? (
            <ButtonLink href={ROUTES.newCell} variant="secondary" size="sm" shape="rounded" className="shrink-0 font-bold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </ButtonLink>
          ) : null}
        />

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        <section id={SUPERVISORS_SECTION_ID} className="scroll-mt-4">
          <TeamStructureSearch query={query} filter={activeFilter} sectionId={SUPERVISORS_SECTION_ID} />
        </section>

        {activeFilter !== FILTER_ALL ? (
          <TeamFilterContextCard
            filter={activeFilter}
            title={filterContent.contextTitle}
            detail={filterContent.contextDetail}
          />
        ) : null}

        <section>
          <SectionTitle detail={filterContent.listDetail} className={teamCardStyles.teamSectionHeading}>
            {filterContent.listTitle}
          </SectionTitle>
          {filteredSupervisors.length > 0 ? (
            <ProgressiveList
              initialCount={SUPERVISOR_SECTION_LIMIT}
              step={SUPERVISOR_SECTION_LIMIT}
              moreLabel="Ver mais supervisores"
              lessLabel="Mostrar menos supervisores"
            >
              {filteredSupervisors.map((supervisor) => (
                <TeamSupervisorCard key={supervisor.id} supervisor={supervisor} activeFilter={activeFilter} />
              ))}
            </ProgressiveList>
          ) : (
            <EmptyState title={isFiltered ? "Nenhum resultado nesse recorte" : "Nenhum supervisor cadastrado"}>
              {isFiltered
                ? filterContent.empty
                : "Quando supervisores forem cadastrados, a estrutura da equipe aparecerá aqui."
              }
            </EmptyState>
          )}
        </section>

        <TeamStructureAdjustments
          unassignedGroups={filteredUnassignedGroups}
          inactiveGroups={filteredInactiveGroups}
        />

      </div>
    </AppShell>
  );
}
