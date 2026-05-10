import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PulseCard } from "@/components/base-cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { groupNameOrFallback } from "@/features/groups/group-display";
import { buildSupervisorPageView } from "@/features/pastoral-home/supervisor-page-view";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function SupervisorPage() {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getSupervisorDashboard(user);
  const view = buildSupervisorPageView({ dashboard, user });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: view.navIndicator })}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={view.pastoralPulse.title}
        subtitle={view.pastoralPulse.subtitle}
        tone={view.pastoralPulse.tone}
      />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem com mais destaque."
        emptyMessage="Nenhum caso urgente ou encaminhado agora."
        signals={view.urgentSignals}
        viewer={user}
        contextForSignal={(signal) => groupNameOrFallback(signal.group)}
      />

      <PastoralSignalSection
        title="Pedidos de apoio"
        detail="Pedidos trazidos pelos líderes aparecem separados, para apoiar sem virar operador da célula."
        emptyMessage="Nenhum líder pediu apoio agora."
        signals={view.supportSignals}
        viewer={user}
        contextForSignal={(signal) => groupNameOrFallback(signal.group)}
        ctaLabelForSignal={() => "Abrir apoio"}
      />

      <PastoralSignalSection
        title="Acompanhar de perto"
        detail="Atenções locais das células supervisionadas."
        emptyMessage="Nenhum outro caso em atenção agora."
        signals={view.attentionSignals}
        viewer={user}
        contextForSignal={(signal) => groupNameOrFallback(signal.group)}
      />

      <InCareSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        people={view.inCarePeople}
      />
    </AppShell>
  );
}
