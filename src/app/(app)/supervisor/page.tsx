import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, PulseCard } from "@/components/shared/base-cards";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { appNavForRole } from "@/features/navigation/app-nav";
import { SupervisorFocusPanel } from "@/features/pastoral-home/components/supervisor-focus-panel";
import { buildSupervisorPageView } from "@/features/pastoral-home/supervisor-page-view";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROUTES } from "@/lib/routes";

export default async function SupervisorPage() {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect(ROUTES.root);
  }

  const dashboard = await getSupervisorDashboard(user);
  const view = buildSupervisorPageView({ dashboard, user });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <PulseCard
        title={view.pastoralPulse.title}
        subtitle={view.pastoralPulse.subtitle}
        tone={view.pastoralPulse.tone}
      />

      {view.focusItems.length > 0 ? (
        <SupervisorFocusPanel items={view.focusItems} />
      ) : (
        <EmptyState>
          Tudo tranquilo agora. Nenhum ponto de acompanhamento pastoral aberto no seu escopo.
        </EmptyState>
      )}
    </AppShell>
  );
}
