import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { CellsPageSections } from "@/features/groups/components/cells-page-sections";
import { CellsStructureSearch } from "@/features/groups/components/cells-structure-search";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero } from "@/components/shared/page-hero";
import { ContextSummary, EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { buildWeeklyPresenceSummaryItem } from "@/features/dashboard/presence-health";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { CELLS_SECTION_ID, readCellsFilter } from "@/features/groups/cells-page-filters";
import { buildCellsPageView } from "@/features/groups/cells-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups, canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firstParam } from "@/lib/search-params";
import { normalizeSearchText } from "@/lib/text";
import { UserRole } from "@/generated/prisma/client";
import { NO_RECENT_PRESENCE_LABEL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

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
      headerVariant="compact"
    >
      <div className={pageStyles.page}>
        <PageHero
          compact
          eyebrow="Supervisão"
          title="Células"
          description="Células sob sua supervisão, por atenção pastoral."
          action={canCreateGroup ? (
            <ButtonLink href={ROUTES.newCell} size="sm" className="shrink-0 rounded-2xl px-3 font-bold">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </ButtonLink>
          ) : null}
        />

        <div className={pageStyles.summaryBlock}>
          <ContextSummary
            items={[
              {
                label: "Células acompanhadas",
                value: String(dashboard.groups.length),
                detail: "Sob sua supervisão.",
                tone: "neutral",
              },
              buildWeeklyPresenceSummaryItem(dashboard.hasPresenceData, dashboard.presenceRate),
              {
                label: "Pedem cuidado mais próximo",
                value: String(view.groupsNeedingAttentionCount),
                detail: view.groupsNeedingAttentionCount > 0
                  ? "Prioridade no acompanhamento."
                  : "Sem alerta aberto agora.",
                tone: view.groupsNeedingAttentionCount > 0 ? "warn" : "ok",
              },
              {
                label: NO_RECENT_PRESENCE_LABEL,
                value: String(view.groupsWithoutPresenceCount),
                detail: view.groupsWithoutPresenceCount > 0
                  ? "Confira encontros pendentes."
                  : "Todas com registro recente.",
                tone: view.groupsWithoutPresenceCount > 0 ? "neutral" : "ok",
              },
            ]}
          />
        </div>

        <section id={CELLS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque ou filtre por atenção.">Células supervisionadas</SectionTitle>
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

      </div>
    </AppShell>
  );
}
