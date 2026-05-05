import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PulseCard } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { signalDetailForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";

export default async function SupervisorPage() {
  const user = await getCurrentUser();

  if (!canUseSupervisorDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getSupervisorDashboard(user);
  const rawInCarePeople = dashboard.groups
    .flatMap((group) => group.memberships.map((membership) => ({ ...membership.person, groupName: group.name })));
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: rawInCarePeople,
    viewer: user,
  });
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const firstUrgentSignal = urgentSignals[0];
  const firstSupportRequest = supportSignals[0];
  const firstSignal = dashboard.attentionPeople[0];
  const urgentSignalsCount = urgentSignals.length;
  const supportRequestsCount = supportSignals.length;
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const navIndicator = urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined;
  const pulseTitle = firstUrgentSignal
    ? `${urgentSignalsCount} ${urgentSignalsCount === 1 ? "caso urgente precisa" : "casos urgentes precisam"} da sua presença.`
    : firstSupportRequest
      ? `${supportRequestsCount} ${supportRequestsCount === 1 ? "pedido de apoio precisa" : "pedidos de apoio precisam"} da sua presença.`
      : firstSignal
        ? `${firstSignal.person.fullName} precisa de um olhar mais próximo.`
        : "Suas células estão estáveis agora.";
  const pulseSubtitle = firstUrgentSignal
    ? `${firstUrgentSignal.person.fullName} · ${firstUrgentSignal.group.name}: comece por este cuidado antes dos demais acompanhamentos.`
    : firstSupportRequest
      ? `${firstSupportRequest.person.fullName} · ${firstSupportRequest.group.name}: comece por este cuidado e acompanhe os líderes com calma.`
      : firstSignal
        ? `${firstSignal.group.name}: ${signalDetailForViewer(firstSignal, user)}`
        : "Continue perto dos líderes e das células, sem transformar acompanhamento em cobrança.";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={pulseTitle}
        subtitle={pulseSubtitle}
        tone={firstUrgentSignal || firstSupportRequest || firstSignal ? "attention" : "ok"}
      />

      <PastoralSignalSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem antes dos demais."
        emptyMessage="Nenhum caso urgente ou encaminhado agora."
        signals={urgentSignals}
        viewer={user}
        contextForSignal={(signal) => signal.group?.name ?? "Sem célula"}
      />

      <PastoralSignalSection
        title="Pedidos de apoio"
        detail="Pedidos trazidos pelos líderes aparecem primeiro, para você apoiar sem virar operador da célula."
        emptyMessage="Nenhum líder pediu apoio agora."
        signals={supportSignals}
        viewer={user}
        contextForSignal={(signal) => signal.group?.name ?? "Sem célula"}
        ctaLabelForSignal={() => "Abrir apoio"}
      />

      <PastoralSignalSection
        title="Acompanhar de perto"
        detail="Atenções locais das células supervisionadas."
        emptyMessage="Nenhum outro caso em atenção agora."
        signals={attentionSignals}
        viewer={user}
        contextForSignal={(signal) => signal.group?.name ?? "Sem célula"}
      />

      <InCareSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        people={inCarePeople}
      />
    </AppShell>
  );
}
