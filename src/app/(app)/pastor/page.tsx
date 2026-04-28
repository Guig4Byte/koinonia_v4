import { AppShell } from "@/components/app-shell";
import { EventMacroCard, GroupCard, MetricRow, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getPastorDashboard } from "@/features/dashboard/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function PastorPage() {
  const user = await getCurrentUser();
  const dashboard = await getPastorDashboard(user.churchId);

  const phrase = dashboard.openSignals.length > 0
    ? `${dashboard.openSignals.length} pessoas merecem atenção nesta semana.`
    : "Nenhuma atenção urgente aberta agora.";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/pastor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: dashboard.openSignals.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox />
      <PulseCard
        title={phrase}
        subtitle={`${dashboard.completedEvents} de ${dashboard.plannedEvents} células já registraram presença. Presença geral: ${dashboard.presenceRate}%.`}
      />

      <MetricRow
        metrics={[
          { label: "presença", value: `${dashboard.presenceRate}%`, tone: dashboard.presenceRate < 65 ? "risk" : "ok" },
          { label: "atenções", value: String(dashboard.openSignals.length), tone: dashboard.openSignals.length ? "risk" : "ok" },
          { label: "visitantes", value: String(dashboard.visitors), tone: "neutral" },
        ]}
      />

      <SectionTitle>Eventos da semana</SectionTitle>
      <EventMacroCard
        title="Células"
        realized={dashboard.completedEvents}
        planned={dashboard.plannedEvents}
        presenceRate={dashboard.presenceRate}
        visitors={dashboard.visitors}
      />

      <SectionTitle>Quem precisa do seu coração</SectionTitle>
      <div className="space-y-3">
        {dashboard.openSignals.slice(0, 3).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            personId={signal.person.id}
            phone={signal.person.phone}
            context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
        {dashboard.openSignals.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Tudo calmo por enquanto.</p>
        ) : null}
      </div>

      <SectionTitle>Células em atenção</SectionTitle>
      <div className="space-y-3">
        {dashboard.groups.filter((group) => group.attentionCount > 0 || group.presenceRate < 70).slice(0, 4).map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leaderName} · ${group.supervisorName}`}
            presenceRate={group.presenceRate}
            attentionCount={group.attentionCount}
          />
        ))}
      </div>
    </AppShell>
  );
}
