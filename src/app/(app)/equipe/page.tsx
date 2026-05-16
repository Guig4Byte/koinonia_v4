import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ContextSummary, EmptyState, InfoCard, SectionTitle } from "@/components/shared/base-cards";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero } from "@/components/shared/page-hero";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { PastoralHealthCard } from "@/features/dashboard/components/pastoral-health-card";
import { TeamStructureSearch } from "@/features/team/components/team-structure-search";
import { InactiveTeamGroupLink, TeamGroupLink, TeamSupervisorCard } from "@/features/team/components/team-structure-cards";
import { GroupKind } from "@/generated/prisma/client";
import { getPastorTeamOverview } from "@/features/dashboard/queries";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups, canUsePastorDashboard } from "@/features/permissions/permissions";
import {
  buildTeamPageLists,
  readTeamFilter,
  SUPERVISOR_SECTION_LIMIT,
  SUPERVISORS_SECTION_ID,
  TEAM_SECTION_LIMIT,
  teamNavIndicator,
  teamSavedMessage,
} from "@/features/team/team-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { normalizeSearchText } from "@/lib/text";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

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
            <ButtonLink href={ROUTES.newCell} variant="secondary" size="sm" className="shrink-0 rounded-2xl px-3 font-bold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </ButtonLink>
          ) : null}
        />

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        <div className={pageStyles.summaryBlock}>
          <SectionTitle>Resumo</SectionTitle>
          <ContextSummary
            variant="balanced"
            items={[
              {
                label: "Supervisores",
                value: String(team.summary.supervisorsCount),
                detail: "Acompanhamento pastoral.",
                tone: "neutral",
              },
              {
                label: "Células ativas",
                value: String(team.summary.groupsCount),
                detail: "Células em acompanhamento.",
                tone: "neutral",
              },
              {
                label: "Sem supervisor",
                value: String(team.summary.groupsWithoutSupervisorCount),
                detail: team.summary.groupsWithoutSupervisorCount > 0
                  ? "Precisam de responsável."
                  : "Todas vinculadas.",
                tone: team.summary.groupsWithoutSupervisorCount > 0 ? "warn" : "ok",
              },
              {
                label: "Inativas",
                value: String(inactiveGroups.length),
                detail: inactiveGroups.length > 0
                  ? "Fora do acompanhamento ativo."
                  : "Nenhuma célula pausada.",
                tone: "neutral",
              },
            ]}
          />
        </div>

        <PastoralHealthCard
          overview={team.healthOverview}
          title="Saúde das células"
          description="Leitura pastoral das células ativas por estabilidade, presença recente e cuidado."
          className="mt-4 mb-0"
        />

        <section id={SUPERVISORS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle className="mt-4" detail="Busque ou filtre por atenção.">Estrutura da equipe</SectionTitle>
          <TeamStructureSearch query={query} filter={activeFilter} sectionId={SUPERVISORS_SECTION_ID} />
        </section>

        <section>
          <SectionTitle detail="Prioridade e presença por supervisor.">Supervisores</SectionTitle>
          {filteredSupervisors.length > 0 ? (
            <ProgressiveList
              initialCount={SUPERVISOR_SECTION_LIMIT}
              step={SUPERVISOR_SECTION_LIMIT}
              moreLabel="Ver mais supervisores"
              lessLabel="Mostrar menos supervisores"
            >
              {filteredSupervisors.map((supervisor) => (
                <TeamSupervisorCard key={supervisor.id} supervisor={supervisor} />
              ))}
            </ProgressiveList>
          ) : (
            <EmptyState>
              {isFiltered ? "Nenhum supervisor ou célula encontrado nesse recorte." : "Nenhum supervisor cadastrado para esta igreja."}
            </EmptyState>
          )}
        </section>

        {filteredUnassignedGroups.length > 0 ? (
          <section>
            <SectionTitle detail="Células ativas sem vínculo.">Sem supervisor</SectionTitle>
            <ProgressiveList
              initialCount={TEAM_SECTION_LIMIT}
              step={TEAM_SECTION_LIMIT}
              moreLabel="Ver mais células"
              lessLabel="Mostrar menos células"
            >
              {filteredUnassignedGroups.map((group) => (
                <TeamGroupLink key={group.id} group={group} />
              ))}
            </ProgressiveList>
          </section>
        ) : null}

        {filteredInactiveGroups.length > 0 ? (
          <section>
            <SectionTitle detail="Abra para reativar ou ajustar.">Células inativas</SectionTitle>
            <ProgressiveList
              initialCount={TEAM_SECTION_LIMIT}
              step={TEAM_SECTION_LIMIT}
              moreLabel="Ver mais células inativas"
              lessLabel="Mostrar menos células inativas"
            >
              {filteredInactiveGroups.map((group) => (
                <InactiveTeamGroupLink key={group.id} group={group} />
              ))}
            </ProgressiveList>
          </section>
        ) : null}

      </div>
    </AppShell>
  );
}
