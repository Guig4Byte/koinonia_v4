import { AppShell } from "@/components/app-shell";
import { MetricRow, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { CheckInList } from "@/components/check-in-list";
import { SearchBox } from "@/components/search-box";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function LeaderPage() {
  const user = await getCurrentUser();
  const dashboard = await getLeaderDashboard(user);
  const group = dashboard.groups[0];

  const currentEvent = group
    ? await prisma.event.findFirst({
        where: { groupId: group.id, type: "CELL_MEETING" },
        orderBy: { startsAt: "desc" },
        include: { attendances: { include: { person: true } } },
      })
    : null;

  const members = group?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: currentEvent?.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];
  const currentEventCompleted = currentEvent ? currentEvent.status === "COMPLETED" || currentEvent.attendances.length > 0 : false;
  const currentVisitors = currentEvent?.attendances
    .filter((attendance) => attendance.status === "VISITOR")
    .map((attendance) => ({ id: attendance.id, fullName: attendance.person.fullName })) ?? [];

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: "/lider", label: "Visão", icon: "home", active: true },
        { href: "/pessoas", label: "Membros", icon: "people", attention: dashboard.signals.length > 0 },
        { href: "/eventos", label: "Eventos", icon: "calendar" },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox placeholder="Buscar membro..." />
      <PulseCard
        title={dashboard.signals[0] ? `${dashboard.signals[0].person.fullName} precisa de você.` : `${group?.name ?? "Sua célula"} está tranquila agora.`}
        subtitle={dashboard.signals[0] ? dashboard.signals[0].reason : "Registre a presença quando a célula acontecer."}
      />

      <MetricRow
        metrics={[
          { label: "membros", value: String(members.length), tone: "neutral" },
          { label: "presença", value: `${dashboard.presenceRate}%`, tone: dashboard.presenceRate < 65 ? "risk" : "ok" },
          { label: "atenções", value: String(dashboard.signals.length), tone: dashboard.signals.length ? "risk" : "ok" },
        ]}
      />

      <SectionTitle>Presença da célula</SectionTitle>
      {currentEvent ? (
        <CheckInList
          eventId={currentEvent.id}
          members={members}
          initialVisitors={currentVisitors}
          submitLabel={currentEventCompleted ? "Atualizar" : "Finalizar"}
          mode={currentEventCompleted ? "adjust" : "register"}
        />
      ) : (
        <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card text-sm text-[var(--color-text-secondary)]">Nenhum evento de célula encontrado. Rode o seed ou crie um evento.</p>
      )}

      <SectionTitle>Quem merece atenção</SectionTitle>
      <div className="space-y-3">
        {dashboard.signals.slice(0, 3).map((signal) => (
          <PersonSignalCard
            key={signal.id}
            initials={initials(signal.person.fullName)}
            name={signal.person.fullName}
            personId={signal.person.id}
            phone={signal.person.phone}
            context={signal.reason}
            severity={signal.severity === "URGENT" ? "risk" : "warn"}
          />
        ))}
      </div>
    </AppShell>
  );
}
