import { AppShell } from "@/components/app-shell";
import { ContextSummary, GroupCard, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function SupervisorPage() {
  const user = await getCurrentUser();
  const dashboard = await getSupervisorDashboard(user);
  const firstSupportRequest = dashboard.supportRequests[0];
  const firstSignal = dashboard.attentionPeople[0];
  const hasRecentPresence = dashboard.recordedEventsCount > 0;
  const pendingLocalAttention = Math.max(dashboard.attentionPeople.length - dashboard.supportRequests.length, 0);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/supervisor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: dashboard.attentionPeople.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <PulseCard
        title={firstSupportRequest ? `${firstSupportRequest.person.fullName} pediu apoio da supervisão.` : firstSignal ? `${firstSignal.person.fullName} merece atenção.` : "Suas células estão estáveis agora."}
        subtitle={firstSupportRequest ? `${firstSupportRequest.group.name}: ${firstSupportRequest.reason}` : firstSignal ? `${firstSignal.group.name}: ${firstSignal.reason}` : "Continue acompanhando presença e apoiando os líderes quando algo aparecer."}
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

      <SectionTitle>Pedidos de apoio</SectionTitle>
      <div className="space-y-3">
        {dashboard.supportRequests.slice(0, 4).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context={signal.group.name}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
            ctaLabel="Abrir apoio"
          />
        ))}
        {dashboard.supportRequests.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhum líder pediu apoio agora.</p>
        ) : null}
      </div>

      <SectionTitle>Pessoas para acompanhar</SectionTitle>
      <div className="space-y-3">
        {dashboard.attentionPeople.slice(0, 4).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            detailHref={`/pessoas/${signal.person.id}`}
            context={signal.group.name}
            reason={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
            ctaLabel={signal.assignedToId === user.id ? "Abrir apoio" : "Abrir cuidado"}
          />
        ))}
        {dashboard.attentionPeople.length === 0 ? (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhuma pessoa em atenção agora.</p>
        ) : null}
      </div>

      <SectionTitle>Suas células</SectionTitle>
      <div className="space-y-3">
        {dashboard.groups.map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leader?.name ?? "Sem líder"} · ${group.memberships.length} pessoas${group.supportRequestsCount > 0 ? ` · ${group.supportRequestsCount} pedido(s) de apoio` : ""}`}
            presenceRate={group.presenceRate}
            attentionCount={group.attentionCount}
            href={`/celulas/${group.id}`}
            hasPresenceData={group.recordedEventsCount > 0}
          />
        ))}
      </div>
    </AppShell>
  );
}
