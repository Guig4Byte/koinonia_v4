import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { ContextSummary, PulseCard, SectionTitle } from "@/components/base-cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
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
      <SearchBox placeholder="Buscar qualquer pessoa..." />
      <PulseCard
        title={view.pastoralPulse.title}
        subtitle={view.pastoralPulse.subtitle}
        tone={view.pastoralPulse.tone}
      />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem com mais destaque."
        emptyMessage="Nada grave ou encaminhado chegou para o pastor agora."
        signals={view.urgentOrPastoralCases}
        viewer={user}
      />

      <InCareSection
        title="Acolhidos em cuidado pastoral"
        detail="Pessoas que receberam cuidado pastoral e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado pastoral para destacar agora."
        people={view.inCarePeople}
      />

      <SectionTitle>Presença geral</SectionTitle>
      <ContextSummary items={view.presenceSummary} />
    </AppShell>
  );
}
