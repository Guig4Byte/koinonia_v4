import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { GroupForm } from "@/components/group-form";
import { createCellAction } from "@/app/(app)/celulas/actions";
import { appNavForRole } from "@/features/navigation/app-nav";
import { canManageGroups } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

type NewCellPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewCellPage({ searchParams }: NewCellPageProps) {
  const user = await getCurrentUser();

  if (!canManageGroups(user)) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "secondary" })}
    >
      <GroupForm
        title="Nova célula"
        description="Cadastre apenas o essencial para a célula aparecer na estrutura pastoral e gerar encontros quando tiver agenda padrão."
        backHref="/equipe"
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
