import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import pageStyles from "@/components/shared/consultation-page.module.css";
import { GroupForm } from "@/features/groups/components/group-form";
import { updateCellAction } from "@/app/(app)/celulas/actions";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups } from "@/features/permissions/permissions";
import { GroupKind } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";

type EditCellPageProps = {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditCellPage({ params, searchParams }: EditCellPageProps) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirect(ROUTES.root);
  }

  const { groupId } = await params;
  const queryParams = searchParams ? await searchParams : {};
  const group = await prisma.smallGroup.findFirst({
    where: {
      id: groupId,
      churchId: user.churchId,
      kind: GroupKind.CELL,
    },
    select: {
      id: true,
      name: true,
      meetingDayOfWeek: true,
      meetingTime: true,
      locationName: true,
      isActive: true,
    },
  });

  if (!group) notFound();

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary" })}
      hideBottomNav
      headerVariant="compact"
    >
      <div className={pageStyles.page}>
        <GroupForm
          title="Editar célula"
          description="Dados básicos da célula, sem alterar liderança e supervisão nesta tela."
          backHref={group.isActive ? ROUTES.group(group.id) : ROUTES.team}
          backLabel={group.isActive ? "Voltar para célula" : "Voltar para equipe"}
          action={updateCellAction.bind(null, group.id)}
          submitLabel="Salvar célula"
          errorCode={firstParam(queryParams.erro)}
          initialValues={{
            name: group.name,
            meetingDayOfWeek: group.meetingDayOfWeek,
            meetingTime: group.meetingTime,
            locationName: group.locationName,
            isActive: group.isActive,
          }}
        />
      </div>
    </AppShell>
  );
}
