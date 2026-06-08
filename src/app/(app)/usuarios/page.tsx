import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, InfoCard } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { UserList } from "@/features/users/components/user-list";
import { UsersStructureSearch } from "@/features/users/components/users-structure-search";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageUsers } from "@/features/permissions/permissions";
import { userRoleLabels, userRolePluralLabels } from "@/features/users/user-display";
import {
  USERS_SECTION_ID,
  USER_FILTER_INACTIVE,
  readUsersFilter,
  userRoleForFilter,
  type UsersFilter,
} from "@/features/users/user-filters";
import { type Prisma, UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { FILTER_ACTIVE, FILTER_ALL } from "@/lib/filter-param";
import { routeWithQuery, ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const USERS_PAGE_SIZE = 20;

function savedMessage(value: string) {
  if (value === "usuario-criado") return "Usuário criado. Entregue o login e a senha inicial com cuidado.";
  if (value === "usuario-atualizado") return "Usuário atualizado.";
  return null;
}

function roleCountLabel(role: UserRole, count: number) {
  return `${count} ${count === 1 ? userRoleLabels[role].toLowerCase() : userRolePluralLabels[role]}`;
}

function readUsersPage(value: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function userSearchWhere(query: string): Prisma.UserWhereInput {
  if (!query) return {};

  return {
    OR: [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { person: { is: { fullName: { contains: query, mode: "insensitive" } } } },
      { person: { is: { phone: { contains: query } } } },
    ],
  };
}

function userFilterWhere(filter: UsersFilter): Prisma.UserWhereInput {
  if (filter === FILTER_ACTIVE) return { isActive: true };
  if (filter === USER_FILTER_INACTIVE) return { isActive: false };

  const role = userRoleForFilter(filter);
  return role ? { role } : {};
}

function usersPageHref({
  query,
  filter,
  page,
}: {
  query: string;
  filter: UsersFilter;
  page: number;
}) {
  const path = routeWithQuery(ROUTES.users, {
    q: query,
    filtro: filter === FILTER_ALL ? null : filter,
    pagina: page > 1 ? page : null,
  });

  return `${path}#${USERS_SECTION_ID}`;
}

function resultRangeLabel({
  total,
  currentPage,
}: {
  total: number;
  currentPage: number;
}) {
  if (total === 0) return "Nenhum usuário encontrado nesse recorte.";

  const start = (currentPage - 1) * USERS_PAGE_SIZE + 1;
  const end = Math.min(currentPage * USERS_PAGE_SIZE, total);
  const userLabel = total === 1 ? "usuário" : "usuários";
  return `Mostrando ${start}-${end} de ${total} ${userLabel}.`;
}

function UsersPagination({
  query,
  filter,
  currentPage,
  totalPages,
}: {
  query: string;
  filter: UsersFilter;
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label="Paginação de usuários">
      <p className="k-section-detail min-w-0 flex-1">
        Página {currentPage} de {totalPages}
      </p>
      <div className="flex flex-wrap gap-2">
        {currentPage > 1 ? (
          <ButtonLink
            href={usersPageHref({ query, filter, page: currentPage - 1 })}
            variant="quiet"
            size="sm"
            shape="pill"
            density="inlineCompact"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Anterior
          </ButtonLink>
        ) : null}
        {currentPage < totalPages ? (
          <ButtonLink
            href={usersPageHref({ query, filter, page: currentPage + 1 })}
            variant="secondary"
            size="sm"
            shape="pill"
            density="inlineCompact"
          >
            Próxima
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        ) : null}
      </div>
    </nav>
  );
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirect(ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};
  const saved = savedMessage(firstParam(params.salvo));
  const query = firstParam(params.q).trim();
  const activeFilter = readUsersFilter(firstParam(params.filtro));
  const requestedPage = readUsersPage(firstParam(params.pagina));
  const where: Prisma.UserWhereInput = {
    churchId: user.churchId,
    ...userSearchWhere(query),
    ...userFilterWhere(activeFilter),
  };

  const [summaryRows, totalFilteredUsers] = await Promise.all([
    prisma.user.groupBy({
      by: ["role", "isActive"],
      where: { churchId: user.churchId },
      _count: { _all: true },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / USERS_PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      person: { select: { id: true, fullName: true, phone: true } },
    },
    orderBy: [
      { isActive: "desc" },
      { role: "asc" },
      { name: "asc" },
    ],
    skip: (currentPage - 1) * USERS_PAGE_SIZE,
    take: USERS_PAGE_SIZE,
  });

  let inactiveUsersCount = 0;
  const activeCountByRole = new Map<UserRole, number>();

  for (const row of summaryRows) {
    const count = row._count._all;

    if (row.isActive) {
      activeCountByRole.set(row.role, (activeCountByRole.get(row.role) ?? 0) + count);
    } else {
      inactiveUsersCount += count;
    }
  }

  const roleCounts = [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPERVISOR, UserRole.LEADER]
    .map((role) => roleCountLabel(role, activeCountByRole.get(role) ?? 0));
  const isFiltered = Boolean(query) || activeFilter !== FILTER_ALL;
  const clearFiltersHref = `${ROUTES.users}#${USERS_SECTION_ID}`;

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", secondaryHref: ROUTES.team })}
      headerVariant="compact"
    >
      <div className={pageStyles.page}>
        <PageHero
          compact
          eyebrow="Acesso interno"
          title="Usuários"
          description="Crie e mantenha os acessos de pastor, supervisores e líderes. Cadastro público continua fechado."
          action={(
            <ButtonLink href={ROUTES.newUser} variant="actionPillPrimary" size="sm" density="actionPill" className="shrink-0">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo usuário
            </ButtonLink>
          )}
        />

        {saved ? <InfoCard tone="success">{saved}</InfoCard> : null}

        <Card padding="sm" radius="lg" surface="summaryGlow" className="space-y-2">
          <p className="k-eyebrow">Resumo de acesso</p>
          <p className="text-[length:var(--text-sm)] leading-relaxed text-[color:var(--color-text-secondary)]">
            {roleCounts.join(" · ")}. {inactiveUsersCount > 0 ? `${inactiveUsersCount} inativo${inactiveUsersCount === 1 ? "" : "s"}.` : "Todos os usuários estão ativos."}
          </p>
        </Card>

        <section id={USERS_SECTION_ID} className="scroll-mt-4">
          <SectionHeader
            title="Usuários cadastrados"
            detail="Busque e filtre antes de editar acessos ou conferir vínculos."
          />
          <UsersStructureSearch
            query={query}
            filter={activeFilter}
            sectionId={USERS_SECTION_ID}
          />
          <div className="mt-3 px-1">
            <p className="k-section-detail">{resultRangeLabel({ total: totalFilteredUsers, currentPage })}</p>
          </div>

          {users.length > 0 ? (
            <>
              <UserList users={users} className="mt-4" />
              <UsersPagination
                query={query}
                filter={activeFilter}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </>
          ) : (
            <EmptyState
              title={isFiltered ? "Nenhum usuário nesse recorte" : "Nenhum usuário cadastrado"}
              action={(
                isFiltered ? (
                  <ButtonLink href={clearFiltersHref} variant="quiet" size="sm">
                    Limpar filtros
                  </ButtonLink>
                ) : (
                  <ButtonLink href={ROUTES.newUser} variant="primary" size="sm">
                    Criar primeiro usuário
                  </ButtonLink>
                )
              )}
            >
              {isFiltered
                ? "A busca ou os filtros podem ser limpos para voltar à lista completa."
                : "Quando pastor, supervisores e líderes tiverem acesso, eles aparecerão aqui."
              }
            </EmptyState>
          )}
        </section>
      </div>
    </AppShell>
  );
}
