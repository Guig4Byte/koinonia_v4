import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CellsPageSections } from "@/components/cells-page-sections";
import { CellsStructureSearch } from "@/components/cells-structure-search";
import { ContextSummary, EmptyState, InfoCard, SectionTitle } from "@/components/base-cards";
import { weeklyPresenceTone } from "@/features/dashboard/presence-health";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { CELLS_SECTION_ID, readCellsFilter } from "@/features/groups/cells-page-filters";
import { buildCellsPageView } from "@/features/groups/cells-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups, canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firstParam } from "@/lib/search-params";
import { normalizeSearchText } from "@/lib/text";
import { UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

type CellsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CellsPage({ searchParams }: CellsPageProps) {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect(user.role === UserRole.PASTOR || user.role === UserRole.ADMIN ? ROUTES.team : user.role === UserRole.LEADER ? ROUTES.people : ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};
  const query = firstParam(params.q).trim();
  const activeFilter = readCellsFilter(firstParam(params.filtro));
  const dashboard = await getSupervisorDashboard(user);
  const view = buildCellsPageView({
    dashboard,
    query,
    normalizedQuery: normalizeSearchText(query),
    filter: activeFilter,
  });
  const canCreateGroup = canManageGroups(user);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", indicator: view.navIndicator })}
    >
      <div className="team-page">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="team-title">Células</h2>
            <p className="team-description">
              Acompanhe as células sob sua supervisão sem duplicar os sinais de pessoas da Visão.
            </p>
          </div>
          {canCreateGroup ? (
            <Link
              href={ROUTES.newCell}
              className="k-primary-action inline-flex min-h-10 shrink-0 items-center gap-2 rounded-2xl px-3 text-sm font-bold transition active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </Link>
          ) : null}
        </div>

        <div className="team-summary-block">
          <ContextSummary
            items={[
              {
                label: "Células acompanhadas",
                value: String(dashboard.groups.length),
                detail: "Comunidades que você acompanha de perto.",
                tone: "neutral",
              },
              {
                label: "Presença da semana",
                value: dashboard.hasPresenceData ? `${dashboard.presenceRate}%` : "—",
                detail: dashboard.hasPresenceData
                  ? "Média dos encontros registrados nesta semana."
                  : "Ainda sem presença registrada nesta semana.",
                tone: weeklyPresenceTone(dashboard.hasPresenceData, dashboard.presenceRate),
              },
              {
                label: "Pedem cuidado mais próximo",
                value: String(view.groupsNeedingAttentionCount),
                detail: view.groupsNeedingAttentionCount > 0
                  ? "Células que pedem proximidade, apoio ou discernimento."
                  : "Nenhuma célula pedindo cuidado próximo agora.",
                tone: view.groupsNeedingAttentionCount > 0 ? "warn" : "ok",
              },
              {
                label: "Sem presença recente",
                value: String(view.groupsWithoutPresenceCount),
                detail: view.groupsWithoutPresenceCount > 0
                  ? "Pode haver encontro realizado sem marcação ainda."
                  : "Todas têm presença recente registrada.",
                tone: view.groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
              },
            ]}
          />
        </div>

        <section id={CELLS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque e filtre as células listadas abaixo.">Células supervisionadas</SectionTitle>
          <CellsStructureSearch query={query} filter={activeFilter} sectionId={CELLS_SECTION_ID} />

          <div className="mt-6">
            {view.groups.length > 0 ? (
              <CellsPageSections sections={view.groupedSections} />
            ) : (
              <EmptyState>
                {view.isFiltered ? "Nenhuma célula encontrada nesse recorte." : "Nenhuma célula ativa vinculada à sua supervisão."}
              </EmptyState>
            )}
          </div>
        </section>

        <SectionTitle>Consulta</SectionTitle>
        <InfoCard>
          Abra uma célula para ver liderança, membros e histórico de presença. Os pedidos de apoio e pessoas em atenção continuam priorizados na Visão.
        </InfoCard>
      </div>
    </AppShell>
  );
}
