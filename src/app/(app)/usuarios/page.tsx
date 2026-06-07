import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, InfoCard } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { UserList } from "@/features/users/components/user-list";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageUsers } from "@/features/permissions/permissions";
import { userRoleLabels, userRolePluralLabels } from "@/features/users/user-display";
import { UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

type UsersPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function savedMessage(value: string) {
  if (value === "usuario-criado") return "Usuário criado. Entregue o login e a senha inicial com cuidado.";
  if (value === "usuario-atualizado") return "Usuário atualizado.";
  return null;
}

function roleCountLabel(role: UserRole, count: number) {
  return `${count} ${count === 1 ? userRoleLabels[role].toLowerCase() : userRolePluralLabels[role]}`;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirect(ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};
  const saved = savedMessage(firstParam(params.salvo));

  const users = await prisma.user.findMany({
    where: { churchId: user.churchId },
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
  });

  const activeUsers = users.filter((item) => item.isActive);
  const inactiveUsersCount = users.length - activeUsers.length;
  const roleCounts = [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPERVISOR, UserRole.LEADER]
    .map((role) => roleCountLabel(role, activeUsers.filter((item) => item.role === role).length));

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

        {users.length > 0 ? (
          <UserList users={users} className="mt-4" />
        ) : (
          <EmptyState
            title="Nenhum usuário cadastrado"
            action={(
              <ButtonLink href={ROUTES.newUser} variant="primary" size="sm">
                Criar primeiro usuário
              </ButtonLink>
            )}
          >
            Quando pastor, supervisores e líderes tiverem acesso, eles aparecerão aqui.
          </EmptyState>
        )}
      </div>
    </AppShell>
  );
}
