import { AppShell } from "@/components/layout/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PastoralHealthCard } from "@/features/dashboard/components/pastoral-health-card";
import { PastorPresenceCard } from "@/features/pastoral-home/components/pastor-presence-card";
import { PastorRadarCard } from "@/features/pastoral-home/components/pastor-radar-card";
import { PastorTeamSummaryCard } from "@/features/pastoral-home/components/pastor-team-summary-card";
import { NextPastoralActionCard } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { FirstUseStateCard } from "@/features/pastoral-home/components/first-use-state-card";
import { RegistrationQualityCard } from "@/features/registration-quality/components/registration-quality-card";
import { UpcomingBirthdaysCard } from "@/features/people/components/upcoming-birthdays-card";
import { SearchBox } from "@/features/search/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { getRegistrationQualitySummary } from "@/features/registration-quality/registration-quality.query";
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

  const [dashboard, registrationQuality] = await Promise.all([
    getPastorDashboard(user),
    getRegistrationQualitySummary(user),
  ]);
  const view = buildPastorPageView({ dashboard, user });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <PastorRadarCard pulse={view.pastoralPulse} />

      {view.firstUseState ? <FirstUseStateCard state={view.firstUseState} className="mb-4" /> : null}

      {view.nextAction ? <NextPastoralActionCard action={view.nextAction} /> : null}

      <SearchBox placeholder="Buscar qualquer irmão..." />

      {dashboard.upcomingBirthdays.length > 0 ? (
        <UpcomingBirthdaysCard
          birthdays={dashboard.upcomingBirthdays}
          className="mt-4 mb-0"
          description="Próximos 30 dias da igreja, organizados por célula."
          title="Datas próximas na igreja"
          variant="grouped"
          visibleLimit={5}
        />
      ) : null}

      <PastoralHealthCard
        overview={view.healthOverview}
        title="Saúde das células"
        description="Leitura pastoral das células ativas por estabilidade, presença recente e cuidado."
        className="mt-4 mb-0"
      />

      <PastorPresenceCard weeklyPresence={view.weeklyPresence} className="mt-4" />

      <PastorTeamSummaryCard items={view.teamSummaryItems} />

      <RegistrationQualityCard summary={registrationQuality} className="mt-4" />
    </AppShell>
  );
}
