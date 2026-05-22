import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { GroupKind, UserRole } from "@/generated/prisma/client";
import { AppShell } from "@/components/layout/app-shell";
import { CellsPageSections } from "@/features/groups/components/cells-page-sections";
import { CellsStructureSearch } from "@/features/groups/components/cells-structure-search";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHero } from "@/components/shared/page-hero";
import { EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { CellsOverviewSummaryCard } from "@/features/groups/components/cells-overview-summary-card";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { CELLS_SECTION_ID, readCellsFilter } from "@/features/groups/cells-page-filters";
import { buildCellsPageView } from "@/features/groups/cells-page-view";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups, canUseSupervisorDashboard, getVisibleGroupWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { membersFilterHref, readMembersFilter } from "@/features/people/member-filters";
import { firstParam } from "@/lib/search-params";
import { normalizeSearchText } from "@/lib/text";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

type CellsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CellsPage({ searchParams }: CellsPageProps) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : {};

  if (user.role === UserRole.LEADER) {
    const primaryGroup = await prisma.smallGroup.findFirst({
      where: {
        ...getVisibleGroupWhere(user),
        kind: GroupKind.CELL,
      },
      select: { id: true },
      orderBy: { name: "asc" },
    });

    if (!primaryGroup) {
      redirect(ROUTES.leader);
    }

    redirect(membersFilterHref(ROUTES.group(primaryGroup.id), readMembersFilter(firstParam(params.membros))));
  }

  if (!canUseSupervisorDashboard(user)) {
    redirect(user.role === UserRole.PASTOR || user.role === UserRole.ADMIN ? ROUTES.team : ROUTES.root);
  }

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
            <ButtonLink href={ROUTES.newCell} variant="secondary" size="sm" density="compact" shape="rounded" className="k-action-pill k-action-pill-primary shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova célula
            </ButtonLink>
          ) : null}
        />

        <div className={pageStyles.summaryBlock}>
          <CellsOverviewSummaryCard
            cellsCount={dashboard.groups.length}
            weeklyPresence={dashboard.weeklyPresence}
            groupsNeedingAttentionCount={view.groupsNeedingAttentionCount}
            groupsWithoutPresenceCount={view.groupsWithoutPresenceCount}
          />
        </div>

        <section id={CELLS_SECTION_ID} className="scroll-mt-4">
          <SectionTitle detail="Busque ou filtre por atenção.">Células supervisionadas</SectionTitle>
          <CellsStructureSearch query={query} filter={activeFilter} sectionId={CELLS_SECTION_ID} />

          <div className="mt-6">
            {view.groups.length > 0 ? (
              <CellsPageSections sections={view.groupedSections} activeFilter={activeFilter} />
            ) : (
              <EmptyState title={view.isFiltered ? "Nenhuma célula nesse recorte" : "Nenhuma célula ativa neste escopo"}>
                {view.isFiltered
                  ? "Ajuste a busca ou limpe os filtros para ver as demais células supervisionadas."
                  : "Quando uma célula ativa for vinculada à sua supervisão, ela aparecerá aqui."
                }
              </EmptyState>
            )}
          </div>
        </section>

      </div>
    </AppShell>
  );
}
