import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { ContextSummary, PulseCard, SectionTitle } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function PastorPage() {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getPastorDashboard(user);
  const hasWeekPresence = dashboard.hasPresenceData;
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: dashboard.inCarePeople,
    viewer: user,
  });
  const urgentOrPastoralCases = pastoralSections.urgentOrPastoralCases;
  const inCarePeople = pastoralSections.inCarePeople;
  const pastoralCasesCount = urgentOrPastoralCases.length;
  const navIndicator = pastoralCasesCount > 0 ? "risk" : inCarePeople.length > 0 ? "care" : undefined;

  const phrase = pastoralCasesCount > 0
    ? `${pastoralCasesCount} ${pastoralCasesCount === 1 ? "caso pastoral pede" : "casos pastorais pedem"} olhar mais próximo.`
    : "Nenhum caso pastoral urgente ou encaminhado agora.";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar qualquer pessoa..." />
      <PulseCard
        title={phrase}
        subtitle="A atenção local segue com líderes e supervisores."
        tone={pastoralCasesCount > 0 ? "attention" : "ok"}
      />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem antes das métricas."
        emptyMessage="Nada grave ou encaminhado chegou para o pastor agora."
        signals={urgentOrPastoralCases}
        viewer={user}
      />

      <InCareSection
        title="Acolhidos em cuidado pastoral"
        detail="Pessoas que receberam cuidado pastoral e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado pastoral para destacar agora."
        people={inCarePeople}
      />

      <SectionTitle>Presença geral</SectionTitle>
      <ContextSummary
        items={[
          {
            label: "Presença da semana",
            value: hasWeekPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasWeekPresence ? "Média dos encontros registrados nesta semana." : "Nenhum encontro registrado nesta semana.",
            tone: !hasWeekPresence ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
        ]}
      />
    </AppShell>
  );
}
