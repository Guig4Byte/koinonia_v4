import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { PulseCard } from "@/components/cards";
import { InCareSection, PastoralSignalSection } from "@/components/pastoral-list-cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { signalDetailForViewer } from "@/features/signals/display";
import { buildPastoralPulseMessage } from "@/features/pastoral-pulse";
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
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const firstUrgentSignal = urgentSignals[0];
  const firstSupportRequest = supportSignals[0];
  const firstAttentionSignal = attentionSignals[0];
  const firstInCarePerson = inCarePeople[0];
  const navIndicator = urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined;
  const pastoralPulse = buildPastoralPulseMessage({
    viewerRole: user.role,
    scope: "supervisorDashboard",
    counts: {
      urgentOrPastoral: urgentSignals.length,
      support: supportSignals.length,
      attention: attentionSignals.length,
      inCare: inCarePeople.length,
    },
    subjects: {
      urgentOrPastoral: firstUrgentSignal ? { personName: firstUrgentSignal.person.fullName, groupName: firstUrgentSignal.group.name, detail: signalDetailForViewer(firstUrgentSignal, user) } : null,
      support: firstSupportRequest ? { personName: firstSupportRequest.person.fullName, groupName: firstSupportRequest.group.name, detail: signalDetailForViewer(firstSupportRequest, user) } : null,
      attention: firstAttentionSignal ? { personName: firstAttentionSignal.person.fullName, groupName: firstAttentionSignal.group.name, detail: signalDetailForViewer(firstAttentionSignal, user) } : null,
      inCare: firstInCarePerson ? { personName: firstInCarePerson.fullName, groupName: firstInCarePerson.groupName } : null,
    },
  });

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "home", indicator: navIndicator })}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={pastoralPulse.title}
        subtitle={pastoralPulse.subtitle}
        tone={pastoralPulse.tone}
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
