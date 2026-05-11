import { AppShell } from "@/components/app-shell";
import { EmptyState, SectionTitle } from "@/components/base-cards";
import { EventConsultationCards, EventList, EventsConsultationView } from "@/components/events-page-sections";
import {
  EVENTS_PAGE_HISTORY_LOOKBACK_DAYS,
  EVENTS_PAGE_QUERY_LIMIT,
  buildEventsHomeSections,
  readEventConsultationMode,
  readEventPeriod,
} from "@/features/events/events-page-view";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { appNavForRole } from "@/features/navigation/app-nav";
import { getVisibleEventWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { addBrasiliaDays, endOfBrasiliaWeek, startOfBrasiliaDay } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";

type EventsSearchParams = Promise<{
  consulta?: string | string[];
  periodo?: string | string[];
}>;

async function getEventsForUser(user: PermissionUser, referenceDate: Date) {
  const today = startOfBrasiliaDay(referenceDate);
  const historyStart = addBrasiliaDays(today, -EVENTS_PAGE_HISTORY_LOOKBACK_DAYS);
  const weekEnd = endOfBrasiliaWeek(today, 1);

  return prisma.event.findMany({
    where: {
      AND: [
        getVisibleEventWhere(user),
        { startsAt: { gte: historyStart, lte: weekEnd } },
      ],
    },
    include: { group: { include: { responsibilities: activeGroupResponsibilitiesScopeInclude } }, attendances: true },
    orderBy: { startsAt: "asc" },
    take: EVENTS_PAGE_QUERY_LIMIT,
  });
}

export default async function EventsPage({ searchParams }: { searchParams?: EventsSearchParams }) {
  const user = await getCurrentUser();
  const now = new Date();
  await ensureUpcomingCellMeetingsForUser(user, { referenceDate: now });

  const events = await getEventsForUser(user, now);
  const resolvedSearchParams: Awaited<EventsSearchParams> = searchParams ? await searchParams : {};
  const mode = readEventConsultationMode(firstParam(resolvedSearchParams.consulta));
  const period = readEventPeriod(firstParam(resolvedSearchParams.periodo));
  const { todayEvents, weekEvents } = buildEventsHomeSections(events, now);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events" })}
      headerVariant="compact"
    >
      <div className="events-page">
        {mode ? (
          <EventsConsultationView mode={mode} period={period} events={events} user={user} now={now} />
        ) : (
          <>
            <h2 className="events-title">Encontros</h2>
            <p className="events-description">
              Acompanhe os encontros das células nesta semana e os registros de presença.
            </p>

            <SectionTitle>Hoje</SectionTitle>
            {todayEvents.length > 0 ? <EventList events={todayEvents} user={user} now={now} /> : <EmptyState>Nenhum encontro previsto para hoje.</EmptyState>}

            <SectionTitle>Próximos encontros</SectionTitle>
            {weekEvents.length > 0 ? <EventList events={weekEvents} user={user} now={now} /> : <EmptyState>Nenhum outro encontro agendado para esta semana.</EmptyState>}

            <SectionTitle detail="Veja encontros sem presença registrada ou registros anteriores quando precisar.">Consultar outros encontros</SectionTitle>
            <EventConsultationCards />
          </>
        )}
      </div>
    </AppShell>
  );
}
