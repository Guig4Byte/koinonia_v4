import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UserForm } from "@/features/users/components/user-form";
import { createManagedUserAction } from "@/app/(app)/usuarios/actions";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageUsers } from "@/features/permissions/permissions";
import { UserRole } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

type NewUserPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewUserPage({ searchParams }: NewUserPageProps) {
  const user = await getCurrentUser();

  if (!canManageUsers(user)) {
    redirect(ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};
  const people = await prisma.person.findMany({
    where: { churchId: user.churchId, user: { is: null } },
    select: { id: true, fullName: true, phone: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary", secondaryHref: ROUTES.team })}
      headerVariant="compact"
      hideBottomNav
    >
      <div className={pageStyles.page}>
        <UserForm
          title="Novo usuário"
          description="Crie um acesso interno para quem vai usar o Koinonia. O login pode ser temporário enquanto os e-mails reais não foram coletados."
          action={createManagedUserAction}
          submitLabel="Criar usuário"
          backHref={ROUTES.users}
          backLabel="Voltar para usuários"
          initialValues={{ name: "", email: "", role: UserRole.LEADER, personId: null, isActive: true }}
          personOptions={people}
          errorCode={firstParam(params.erro)}
          requirePassword
        />
      </div>
    </AppShell>
  );
}
