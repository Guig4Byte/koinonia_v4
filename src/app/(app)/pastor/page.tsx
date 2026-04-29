import { AppShell } from "@/components/app-shell";
import { ContextSummary, EmptyState, GroupCard, ListMoreHint, PastoralListSection, PersonMiniCard, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { canUsePastorDashboard } from "@/features/permissions/permissions";
import { signalBadgeForViewer, signalReasonForViewer } from "@/features/signals/display";
import { splitPastoralSections } from "@/features/signals/sections";
import { getCurrentUser } from "@/lib/auth/current-user";
import { initials } from "@/lib/text";
import { redirect } from "next/navigation";

const SECTION_LIMIT = 4;
const GROUPS_TO_REVIEW_LIMIT = 4;

export default async function PastorPage() {
  const user = await getCurrentUser();

  if (!canUsePastorDashboard(user)) {
    redirect("/");
  }

  const dashboard = await getPastorDashboard(user);
  const pendingGroups = dashboard.pendingGroupsCount;
  const hasWeekPresence = dashboard.hasPresenceData;
  const pastoralSections = splitPastoralSections({
    signals: dashboard.attentionPeople,
    inCarePeople: dashboard.inCarePeople,
    viewer: user,
  });
  const urgentOrPastoralCases = pastoralSections.urgentOrPastoralCases;
  const inCarePeople = pastoralSections.inCarePeople;
  const pastoralCasesCount = urgentOrPastoralCases.length;
  const groupsNeedingPastoralLook = dashboard.groups.filter((group) => (
    group.pastoralCasesCount > 0 || (group.hasPresenceData && group.presenceRate < 70)
  ));

  const phrase = pastoralCasesCount > 0
    ? `${pastoralCasesCount} ${pastoralCasesCount === 1 ? "caso pastoral pede" : "casos pastorais pedem"} olhar mais próximo.`
    : "Nenhum caso pastoral urgente ou encaminhado agora.";

  const renderSignalCards = (signals: typeof urgentOrPastoralCases) => signals.map((signal) => {
    const badge = signalBadgeForViewer(signal, user);

    return (
      <PersonSignalCard
        key={signal.id}
        initials={initials(signal.person.fullName)}
        name={signal.person.fullName}
        detailHref={`/pessoas/${signal.person.id}`}
        context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
        reason={signalReasonForViewer(signal.reason, user)}
        severity={signal.severity === "URGENT" ? "risk" : "warn"}
        badgeLabel={badge.label}
        badgeTone={badge.tone}
        ctaLabel="Abrir pessoa"
      />
    );
  });

  const renderInCareLinks = (people: typeof inCarePeople) => people.map((person) => (
    <PersonMiniCard
      key={person.id}
      href={`/pessoas/${person.id}`}
      initials={initials(person.fullName)}
      name={person.fullName}
      context={person.memberships[0]?.group.name ?? "Sem célula"}
      badgeLabel="Em cuidado"
      badgeTone="care"
    />
  ));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/pastor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: pastoralCasesCount > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar qualquer pessoa..." />
      <PulseCard
        title={phrase}
        subtitle={pendingGroups > 0 ? `${pendingGroups} ${pendingGroups === 1 ? "célula ainda não registrou" : "células ainda não registraram"} presença nesta semana.` : "A atenção local segue com líderes e supervisores."}
        tone={pastoralCasesCount > 0 ? "attention" : "ok"}
      />

      <PastoralListSection
        title="Irmãos que precisam de um olhar especial"
        detail="Urgentes ou encaminhados ao pastor aparecem antes das métricas."
        emptyMessage="Nada grave ou encaminhado chegou para o pastor agora."
        hiddenChildren={renderSignalCards(urgentOrPastoralCases.slice(SECTION_LIMIT))}
      >
        {renderSignalCards(urgentOrPastoralCases.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <PastoralListSection
        title="Acolhidos em cuidado"
        detail="Pessoas que já receberam cuidado e seguem no radar."
        emptyMessage="Nenhuma pessoa em cuidado para destacar agora."
        hiddenChildren={renderInCareLinks(inCarePeople.slice(SECTION_LIMIT))}
      >
        {renderInCareLinks(inCarePeople.slice(0, SECTION_LIMIT))}
      </PastoralListSection>

      <SectionTitle>Saúde geral</SectionTitle>
      <ContextSummary
        items={[
          {
            label: "Presença da semana",
            value: hasWeekPresence ? `${dashboard.presenceRate}%` : "—",
            detail: hasWeekPresence ? "Nos encontros já registrados." : "Nenhum encontro registrado nesta semana.",
            tone: !hasWeekPresence ? "neutral" : dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: "Células pendentes",
            value: String(pendingGroups),
            detail: pendingGroups > 0 ? "Ainda não entram na leitura da semana." : "Tudo registrado até aqui.",
            tone: pendingGroups > 0 ? "warn" : "ok",
          },
          {
            label: "Casos pastorais",
            value: String(pastoralCasesCount),
            detail: "Graves ou encaminhados; a atenção comum fica no cuidado local.",
            tone: pastoralCasesCount > 0 ? "risk" : "ok",
          },
        ]}
      />

      <SectionTitle>Saúde das células</SectionTitle>
      <div className="space-y-3">
        {groupsNeedingPastoralLook.slice(0, GROUPS_TO_REVIEW_LIMIT).map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leaderName} · ${group.supervisorName}`}
            presenceRate={group.presenceRate}
            attentionCount={group.pastoralCasesCount}
            attentionLabelKind="pastoral"
            href={`/celulas/${group.id}`}
            hasPresenceData={group.hasPresenceData}
          />
        ))}
        <ListMoreHint hiddenCount={Math.max(0, groupsNeedingPastoralLook.length - GROUPS_TO_REVIEW_LIMIT)} label="Abra Eventos ou busque uma célula quando precisar de contexto adicional." />
        {groupsNeedingPastoralLook.length === 0 ? (
          <EmptyState>Nenhuma célula pedindo olhar especial agora.</EmptyState>
        ) : null}
      </div>
    </AppShell>
  );
}
