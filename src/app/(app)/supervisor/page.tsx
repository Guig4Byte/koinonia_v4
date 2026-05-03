import { AppShell } from "@/components/app-shell";
import { ContextSummary, PastoralListSection, PersonMiniCard, PersonSignalCard, PulseCard } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { canUseSupervisorDashboard } from "@/features/permissions/permissions";
import { signalBadgeForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { redirect } from "next/navigation";
import { initials } from "@/lib/text";

const SECTION_LIMIT = 4;


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
  const firstSupportRequest = pastoralSections.supportRequests[0];
  const firstSignal = dashboard.attentionPeople[0];
  const hasRecentPresence = dashboard.hasPresenceData;
  const urgentSignals = pastoralSections.urgentOrPastoralCases;
  const supportSignals = pastoralSections.supportRequests;
  const attentionSignals = pastoralSections.localAttention;
  const inCarePeople = pastoralSections.inCarePeople;
  const navIndicator = urgentSignals.length > 0 ? "risk" : dashboard.attentionPeople.length > 0 ? "attention" : inCarePeople.length > 0 ? "care" : undefined;

  const renderSignalCards = (signals: typeof dashboard.attentionPeople, ctaLabel = "Abrir pessoa") => signals.map((signal) => {
    const badge = signalBadgeForViewer(signal, user);

    return (
      <PersonSignalCard
        key={signal.id}
        initials={initials(signal.person.fullName)}
        name={signal.person.fullName}
        detailHref={`/pessoas/${signal.person.id}`}
        context={signal.group.name}
        reason={signal.reason}
        severity={signal.severity === "URGENT" ? "risk" : "warn"}
        badgeLabel={badge.label}
        badgeTone={badge.tone}
        ctaLabel={ctaLabel}
      />
    );
  });

  const renderInCareLinks = (people: typeof inCarePeople) => people.map((person) => (
    <PersonMiniCard
      key={person.id}
      href={`/pessoas/${person.id}`}
      initials={initials(person.fullName)}
      name={person.fullName}
      context={person.groupName}
      badgeLabel="Em cuidado"
      badgeTone="care"
    />
  ));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/supervisor", label: "Visão", icon: "home", active: true, indicator: navIndicator },
        { href: "/celulas", label: "Células", icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={firstSupportRequest ? "Essa célula pediu apoio da supervisão." : firstSignal ? `${firstSignal.person.fullName} merece atenção.` : "Suas células estão estáveis agora."}
        subtitle={firstSupportRequest ? `${firstSupportRequest.person.fullName} · ${firstSupportRequest.group.name}: ${firstSupportRequest.reason}` : firstSignal ? `${firstSignal.group.name}: ${firstSignal.reason}` : "Continue acompanhando presença e apoiando os líderes quando algo aparecer."}
        tone={firstSupportRequest || firstSignal ? "attention" : "ok"}
      />

      <ContextSummary
        items={[
          { label: "Células acompanhadas", value: String(dashboard.groups.length), detail: "Sob sua supervisão.", tone: "neutral" },
          {
            label: "Presença recente",
            value: hasRecentPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasRecentPresence ? "Últimos encontros registrados nas suas células." : "Ainda sem encontro registrado no recorte atual.",
            tone: !hasRecentPresence ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: "Pedidos de apoio",
            value: String(dashboard.supportRequests.length),
            detail: "Casos que líderes trouxeram para você.",
            tone: dashboard.supportRequests.length > 0 ? "warn" : "ok",
          },
        ]}
      />

      <PastoralListSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem antes dos demais."
        emptyMessage="Nenhum caso urgente ou encaminhado agora."
        hiddenChildren={renderSignalCards(urgentSignals.slice(SECTION_LIMIT))}
      >
        {renderSignalCards(urgentSignals.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <PastoralListSection
        title="Pedidos de apoio"
        detail="Pedidos trazidos pelos líderes aparecem primeiro, para você apoiar sem virar operador da célula."
        emptyMessage="Nenhum líder pediu apoio agora."
        hiddenChildren={renderSignalCards(supportSignals.slice(SECTION_LIMIT), "Abrir apoio")}
      >
        {renderSignalCards(supportSignals.slice(0, SECTION_LIMIT), "Abrir apoio")}
      </PastoralListSection>

      <PastoralListSection
        title="Acompanhar de perto"
        detail="Atenções locais das células supervisionadas."
        emptyMessage="Nenhum outro caso em atenção agora."
        hiddenChildren={renderSignalCards(attentionSignals.slice(SECTION_LIMIT))}
      >
        {renderSignalCards(attentionSignals.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <PastoralListSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado agora."
        hiddenChildren={renderInCareLinks(inCarePeople.slice(SECTION_LIMIT))}
      >
        {renderInCareLinks(inCarePeople.slice(0, SECTION_LIMIT))}
      </PastoralListSection>
    </AppShell>
  );
}
