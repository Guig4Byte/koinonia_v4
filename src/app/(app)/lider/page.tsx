import { AppShell } from "@/components/app-shell";
import { MetricRow, PersonSignalCard, PulseCard, SectionTitle } from "@/components/cards";
import { CheckInList } from "@/components/check-in-list";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { getLeaderDashboard } from "@/features/dashboard/queries";
import { hasRecordedPresence, selectRelevantCheckInEvent } from "@/features/events/relevant-event";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default async function LeaderPage() {
  const user = await getCurrentUser();
  const dashboard = await getLeaderDashboard(user);
  const groupIds = dashboard.groups.map((group) => group.id);

  const visibleEvents = groupIds.length > 0
    ? await prisma.event.findMany({
        where: { groupId: { in: groupIds }, type: "CELL_MEETING" },
        orderBy: { startsAt: "asc" },
        take: 20,
        include: {
          group: {
            include: {
              memberships: {
                where: { leftAt: null, role: { not: "VISITOR" } },
                include: { person: true },
              },
            },
          },
          attendances: { include: { person: true } },
        },
      })
    : [];

  const currentEvent = selectRelevantCheckInEvent(visibleEvents);
  const currentGroup = currentEvent?.group ?? dashboard.groups[0] ?? null;

  const members = currentGroup?.memberships.map((membership) => ({
    personId: membership.personId,
    fullName: membership.person.fullName,
    currentStatus: currentEvent?.attendances.find((attendance) => attendance.personId === membership.personId)?.status,
  })) ?? [];
  const currentEventCompleted = currentEvent ? hasRecordedPresence(currentEvent) : false;
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
        title={dashboard.signals[0] ? `${dashboard.signals[0].person.fullName} precisa de você.` : `${currentGroup?.name ?? "Sua célula"} está tranquila agora.`}
        subtitle={dashboard.signals[0] ? dashboard.signals[0].reason : "Registre a presença quando a célula acontecer."}
      />

      <MetricRow
        metrics={[
          { label: "membros", value: String(members.length), tone: "neutral" },
          { label: "presença", value: `${dashboard.presenceRate}%`, tone: dashboard.presenceRate < 65 ? "risk" : "ok" },
          { label: "atenções", value: String(dashboard.signals.length), tone: dashboard.signals.length ? "risk" : "ok" },
        ]}
      />

      <SectionTitle>Presença do encontro</SectionTitle>
      {currentEvent ? (
        <>
          <section className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)]">{currentEvent.group?.name ?? "Célula"}</p>
                <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
                  {formatShortDate(currentEvent.startsAt)}, {formatTime(currentEvent.startsAt)}
                </p>
              </div>
              <Badge tone={currentEventCompleted ? "ok" : "warn"}>{currentEventCompleted ? "registrada" : "pendente"}</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {currentEventCompleted
                ? "A presença deste encontro já foi registrada. Ajuste somente se alguma marcação estiver errada."
                : "Este é o encontro mais importante agora. Marque a presença para manter o cuidado em dia."}
            </p>
          </section>
          <CheckInList
            eventId={currentEvent.id}
            members={members}
            initialVisitors={currentVisitors}
            submitLabel={currentEventCompleted ? "Atualizar" : "Finalizar"}
            mode={currentEventCompleted ? "adjust" : "register"}
          />
        </>
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
