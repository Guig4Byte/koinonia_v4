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

  const phrase = dashboard.attentionPeople.length > 0
    ? `${dashboard.attentionPeople.length} ${dashboard.attentionPeople.length === 1 ? "pessoa merece" : "pessoas merecem"} atenção nesta semana.`
    : "Nenhuma pessoa pede atenção urgente agora.";

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/pastor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: dashboard.attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox />
      <PulseCard
        title={phrase}
        subtitle={pendingEvents > 0 ? `${pendingEvents} ${pendingEvents === 1 ? "célula ainda não registrou" : "células ainda não registraram"} presença nesta semana.` : "As presenças da semana estão registradas até aqui."}
        tone={dashboard.attentionPeople.length > 0 ? "attention" : "ok"}
      />

      <ContextSummary
        items={[
          {
            label: "Presença geral",
            value: `${dashboard.presenceRate}%`,
            detail: "Nas células com presença registrada.",
            tone: dashboard.presenceRate < 65 ? "risk" : dashboard.presenceRate < 75 ? "warn" : "ok",
          },
          {
            label: "Células pendentes",
            value: String(pendingEvents),
            detail: "Sem presença registrada nesta semana.",
            tone: pendingEvents > 0 ? "warn" : "ok",
          },
          {
            label: "Visitantes",
            value: String(dashboard.visitors),
            detail: "Novos contatos percebidos nos encontros.",
            tone: "neutral",
          },
        ]}
      />

      <SectionTitle>Quem merece atenção agora</SectionTitle>
      <div className="space-y-3">
        {dashboard.attentionPeople.slice(0, 3).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context={`${signal.group?.name ?? "Sem célula"} · ${signal.group?.leader?.name ?? "Sem líder"}`}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
        {dashboard.attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Tudo calmo por enquanto.</p>
        ) : null}
      </div>

      <SectionTitle>Células para olhar</SectionTitle>
      <div className="space-y-3">
        {dashboard.groups.filter((group) => group.attentionCount > 0 || group.presenceRate < 70).slice(0, 4).map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leaderName} · ${group.supervisorName}`}
            presenceRate={group.presenceRate}
            attentionCount={group.attentionCount}
            href={`/celulas/${group.id}`}
          />
        ))}
        {dashboard.groups.filter((group) => group.attentionCount > 0 || group.presenceRate < 70).length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhuma célula pedindo atenção especial agora.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
