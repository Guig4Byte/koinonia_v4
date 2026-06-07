import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { UserForm } from "@/features/users/components/user-form";
import { updateManagedUserAction } from "@/app/(app)/usuarios/actions";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageUsers } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";
import pageStyles from "@/components/shared/consultation-page.module.css";

type EditUserPageProps = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditUserPage({ params, searchParams }: EditUserPageProps) {
  const viewer = await getCurrentUser();

  if (!canManageUsers(viewer)) {
    redirect(ROUTES.root);
  }

  const { userId } = await params;
  const query = searchParams ? await searchParams : {};
  const managedUser = await prisma.user.findFirst({
    where: { id: userId, churchId: viewer.churchId },
    select: { id: true, name: true, email: true, role: true, isActive: true, personId: true },
  });

  if (!managedUser) notFound();

  const people = await prisma.person.findMany({
    where: {
      churchId: viewer.churchId,
      OR: [
        { user: { is: null } },
        { user: { is: { id: managedUser.id } } },
      ],
    },
    select: { id: true, fullName: true, phone: true },
    orderBy: { fullName: "asc" },
  });

  const updateAction = updateManagedUserAction.bind(null, managedUser.id);

  return (
    <AppShell
      userName={viewer.name}
      role={viewer.role}
      nav={appNavForRole(viewer, { active: "secondary", secondaryHref: ROUTES.team })}
      headerVariant="compact"
      hideBottomNav
    >
      <div className={pageStyles.page}>
        <UserForm
          title="Editar usuário"
          description="Atualize login, papel, vínculo com pessoa e status de acesso. Senha e troca de senha entram na próxima etapa."
          action={updateAction}
          submitLabel="Salvar usuário"
          backHref={ROUTES.users}
          backLabel="Voltar para usuários"
          initialValues={{
            name: managedUser.name,
            email: managedUser.email,
            role: managedUser.role,
            personId: managedUser.personId,
            isActive: managedUser.isActive,
          }}
          personOptions={people}
          errorCode={firstParam(query.erro)}
          selfEditing={managedUser.id === viewer.id}
        />
      </div>
    </AppShell>
  );
}
