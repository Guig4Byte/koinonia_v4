import { AppShell } from "@/components/layout/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { ContextSummary, PulseCard, SectionTitle } from "@/components/shared/base-cards";
import { PastoralHealthCard } from "@/features/dashboard/components/pastoral-health-card";
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
      <PulseCard
        title={view.pastoralPulse.title}
        subtitle={view.pastoralPulse.subtitle}
        tone={view.pastoralPulse.tone}
      />

      <SearchBox placeholder="Buscar qualquer pessoa..." />

      <SectionTitle>Resumo da equipe</SectionTitle>
      <ContextSummary variant="balanced" items={view.teamSummaryItems} />

      <PastoralHealthCard
        overview={view.healthOverview}
        title="Saúde das células"
        description="Leitura pastoral das células ativas por estabilidade, presença recente e cuidado."
        className="mt-4 mb-0"
      />

      <SectionTitle>Presença geral</SectionTitle>
      <ContextSummary items={view.presenceSummary} />
    </AppShell>
  );
}
