import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ContextSummary, EmptyState, InfoCard, SectionTitle } from "@/components/shared/base-cards";
import { ButtonLink } from "@/components/ui/button-link";
import { ProgressiveList } from "@/components/shared/progressive-list";
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
import { NO_RECENT_PRESENCE_LABEL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/cn";
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
  const needsAttentionCount = team.summary.groupsNeedingAttentionCount;
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
        <div className={cn(pageStyles.header, "flex items-center justify-between gap-3")}>
          <div className="min-w-0">
            <h2 className={pageStyles.title}>Equipe</h2>
            <p className={pageStyles.description}>
              Supervisores e células em ordem de atenção pastoral, com presença baixa destacada sem duplicar listas.
            </p>
          </div>
          {canCreateGroup ? (
            <ButtonLink href={ROUTES.newCell} size="sm" className="shrink-0 rounded-2xl px-3 font-bold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </ButtonLink>
          ) : null}
        </div>

        {savedMessage ? <InfoCard tone="success">{savedMessage}</InfoCard> : null}

        <div className={pageStyles.summaryBlock}>
          <SectionTitle>Resumo</SectionTitle>
          <ContextSummary
            variant="balanced"
            items={[
              {
                label: "Supervisores",
                value: String(team.summary.supervisorsCount),
                detail: "Equipe que acompanha líderes e células.",
                tone: "neutral",
              },
              {
                label: "Células ativas",
                value: String(team.summary.groupsCount),
                detail: "Estrutura visível para cuidado pastoral.",
                tone: "neutral",
              },
              {
                label: "Pedem atenção",
                value: String(needsAttentionCount),
                detail: needsAttentionCount > 0
                  ? "Por casos pastorais ou presença baixa registrada."
                  : "Sem caso pastoral ou presença baixa para destacar agora.",
                tone: needsAttentionCount > 0 ? "warn" : "ok",
              },
              {
                label: NO_RECENT_PRESENCE_LABEL,
                value: String(team.summary.groupsWithoutPresenceCount),
                detail: team.summary.groupsWithoutPresenceCount > 0
                  ? "Ainda não há presença recente registrada. Talvez o encontro tenha acontecido, mas a presença ainda não foi marcada."
                  : "Todas têm presença recente registrada.",
                tone: team.summary.groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
              },
            ]}
          />
        </div>

        <section id={SUPERVISORS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque e filtre supervisores e células listadas abaixo.">Estrutura da equipe</SectionTitle>
          <TeamStructureSearch query={query} filter={activeFilter} sectionId={SUPERVISORS_SECTION_ID} />
        </section>

        <section>
          <SectionTitle detail="Resumo por supervisor, priorizando casos pastorais e presença baixa.">Supervisores</SectionTitle>
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
            <SectionTitle detail="Células ativas que ainda não têm supervisor vinculado.">Sem supervisor</SectionTitle>
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
            <SectionTitle detail="Fora das superfícies padrão, encontros e check-in. Abra para reativar ou ajustar dados básicos.">Células inativas</SectionTitle>
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

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença.
        </InfoCard>
      </div>
    </AppShell>
  );
}
