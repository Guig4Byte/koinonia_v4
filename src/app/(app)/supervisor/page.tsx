import { AppShell } from "@/components/app-shell";
import { GroupCard, MetricRow, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { getSupervisorDashboard } from "@/features/dashboard/queries";
import { getCurrentUser } from "@/lib/auth/current-user";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function SupervisorPage() {
  const user = await getCurrentUser();
  const dashboard = await getSupervisorDashboard(user);
  const firstSignal = dashboard.signals[0];

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/supervisor", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Pessoas", icon: "people", attention: dashboard.signals.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa ou célula..." />
      <PulseCard
        title={firstSignal ? `${firstSignal.group.name} precisa de atenção.` : "Suas células estão estáveis agora."}
        subtitle={firstSignal ? `${firstSignal.person.fullName}: ${firstSignal.reason}` : "Continue acompanhando presença e cuidados simples."}
      />
      <MetricRow
        metrics={[
          { label: "células", value: String(dashboard.groups.length), tone: "neutral" },
          { label: "presença", value: `${dashboard.presenceRate}%`, tone: dashboard.presenceRate < 65 ? "risk" : "ok" },
          { label: "atenções", value: String(dashboard.signals.length), tone: dashboard.signals.length ? "risk" : "ok" },
        ]}
      />

      <SectionTitle>Suas células</SectionTitle>
      <div className="space-y-3">
        {dashboard.groups.map((group) => (
          <GroupCard
            key={group.id}
            name={group.name}
            subtitle={`${group.leader?.name ?? "Sem líder"} · ${group.memberships.length} pessoas`}
            presenceRate={group.presenceRate}
            attentionCount={group.signals.length}
          />
        ))}
      </div>

      <SectionTitle>Pessoas para acompanhar</SectionTitle>
      <div className="space-y-3">
        {dashboard.signals.slice(0, 4).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            personId={signal.person.id}
            detailHref={`/pessoas/${signal.person.id}`}
            phone={signal.person.phone}
            context={`${signal.group.name} · ${signal.reason}`}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
      </div>
    </AppShell>
  );
}
