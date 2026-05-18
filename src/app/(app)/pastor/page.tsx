import { AppShell } from "@/components/layout/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PastoralHealthCard } from "@/features/dashboard/components/pastoral-health-card";
import { PastorPresenceCard } from "@/features/pastoral-home/components/pastor-presence-card";
import { PastorRadarCard } from "@/features/pastoral-home/components/pastor-radar-card";
import { PastorTeamSummaryCard } from "@/features/pastoral-home/components/pastor-team-summary-card";
import { SearchBox } from "@/features/search/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import { buildPastorPageView } from "@/features/pastoral-home/pastor-page-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default async function PastorPage() {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect(ROUTES.root);
  }

  const dashboard = await getPastorDashboard(user);
  const view = buildPastorPageView({ dashboard, user });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <PastorRadarCard
        pulse={view.pastoralPulse}
        summary={view.radarSummary}
      />

      <SearchBox placeholder="Buscar qualquer pessoa..." />

      <PastoralHealthCard
        overview={view.healthOverview}
        title="Saúde das células"
        description="Leitura pastoral das células ativas por estabilidade, presença recente e cuidado."
        className="mt-4 mb-0"
      />

      <PastorPresenceCard weeklyPresence={view.weeklyPresence} className="mt-4" />

      <PastorTeamSummaryCard items={view.teamSummaryItems} />
    </AppShell>
  );
}
