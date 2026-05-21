import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { GroupForm } from "@/features/groups/components/group-form";
import { createCellAction } from "@/app/(app)/celulas/actions";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";


type NewCellPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCellPage({ searchParams }: NewCellPageProps) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirect(ROUTES.root);
  }

  const params = searchParams ? await searchParams : {};

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary" })}
      hideBottomNav
      headerVariant="compact"
    >
      <GroupForm
        title="Nova célula"
        description="Cadastre apenas o essencial para a célula aparecer na estrutura pastoral e gerar encontros quando tiver agenda padrão."
        backHref={ROUTES.team}
        backLabel="Voltar para equipe"
        action={createCellAction}
        submitLabel="Salvar célula"
        errorCode={firstParam(params.erro)}
        initialValues={{
          name: "",
          meetingDayOfWeek: null,
          meetingTime: null,
          locationName: null,
          isActive: true,
        }}
      />
    </AppShell>
  );
}
