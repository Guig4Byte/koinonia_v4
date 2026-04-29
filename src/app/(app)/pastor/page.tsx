import { AppShell } from "@/components/app-shell";
import { ContextSummary, GroupCard, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function PastorPage() {
  const user = await getCurrentUser();
  const dashboard = await getPastorDashboard(user.churchId);
  const pendingEvents = Math.max(dashboard.plannedEvents - dashboard.completedEvents, 0);
  const hasWeekPresence = dashboard.completedEvents > 0;
  const pastoralCasesCount = dashboard.attentionPeople.length;
  const groupsNeedingPastoralLook = dashboard.groups.filter((group) => (
    group.attentionCount > 0 || (group.recordedEventsCount > 0 && group.presenceRate < 70)
  ));

  const phrase = pastoralCasesCount > 0
    ? `${pastoralCasesCount} ${pastoralCasesCount === 1 ? "caso pastoral pede" : "casos pastorais pedem"} olhar mais próximo.`
    : "Nenhum caso pastoral urgente ou encaminhado agora.";

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
        subtitle={pendingEvents > 0 ? `${pendingEvents} ${pendingEvents === 1 ? "célula ainda não registrou" : "células ainda não registraram"} presença nesta semana.` : "A atenção local segue com líderes e supervisores."}
        tone={pastoralCasesCount > 0 ? "attention" : "ok"}
      />

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
            value: String(pendingEvents),
            detail: pendingEvents > 0 ? "Ainda não entram na leitura da semana." : "Tudo registrado até aqui.",
            tone: pendingEvents > 0 ? "warn" : "ok",
          },
          {
            label: "Casos pastorais",
            value: String(pastoralCasesCount),
            detail: "Graves ou encaminhados; a atenção comum fica no cuidado local.",
            tone: pastoralCasesCount > 0 ? "risk" : "ok",
          },
        ]}
      />

      <SectionTitle>Casos pastorais em destaque</SectionTitle>
      <div className="space-y-3">
        {dashboard.attentionPeople.slice(0, 3).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
            reason={signal.reason}
            severity="risk"
            ctaLabel="Abrir pessoa"
          />
        ))}
        {pastoralCasesCount === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Nada grave ou encaminhado chegou para o pastor agora. Para consultar alguém específico, use a busca pelo nome.
          </p>
        ) : null}
      </div>

      <SectionTitle>Saúde das células</SectionTitle>
      <div className="space-y-3">
        {groupsNeedingPastoralLook.slice(0, 4).map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leaderName} · ${group.supervisorName}`}
            presenceRate={group.presenceRate}
            attentionCount={group.pastoralCasesCount > 0 ? group.pastoralCasesCount : group.attentionCount}
            attentionLabelKind={group.pastoralCasesCount > 0 ? "pastoral" : "local"}
            href={`/celulas/${group.id}`}
            hasPresenceData={group.recordedEventsCount > 0}
          />
        ))}
        {groupsNeedingPastoralLook.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhuma célula pedindo olhar especial agora.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
