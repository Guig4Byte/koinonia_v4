import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { EventConsultationCards, EventList, EventsConsultationView } from "@/features/events/components/events-page-sections";
import {
  EVENTS_PAGE_HISTORY_LOOKBACK_DAYS,
  EVENTS_PAGE_QUERY_LIMIT,
  buildEventsConsultationSummary,
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
import { cn } from "@/lib/cn";
import pageStyles from "@/components/shared/consultation-page.module.css";

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
  const consultationSummary = buildEventsConsultationSummary(events, now);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events" })}
      headerVariant="compact"
    >
      <div className={cn(pageStyles.page, pageStyles.eventsPage)}>
        {mode ? (
          <EventsConsultationView mode={mode} period={period} events={events} user={user} now={now} />
        ) : (
          <>
            <PageHero
              compact
              eyebrow="Presença"
              title="Encontros"
              description="Encontros da semana e presença em um só lugar."
            />
            <EventConsultationCards summary={consultationSummary} />

            <section className={pageStyles.eventsHomeSection}>
              <SectionTitle className={pageStyles.eventsHomeSectionTitle}>Hoje</SectionTitle>
              {todayEvents.length > 0 ? (
                <EventList events={todayEvents} user={user} now={now} />
              ) : (
                <EmptyState title="Agenda livre hoje">Nenhum encontro previsto para hoje. Próximos encontros ajuda a acompanhar a semana.</EmptyState>
              )}
            </section>

            <section className={pageStyles.eventsHomeSection}>
              <SectionTitle className={pageStyles.eventsHomeSectionTitle}>Próximos encontros</SectionTitle>
              {weekEvents.length > 0 ? (
                <EventList events={weekEvents} user={user} now={now} />
              ) : (
                <EmptyState title="Semana sem novos encontros">Nenhum outro encontro agendado para esta semana. Quando uma célula tiver agenda fixa, ela aparecerá aqui.</EmptyState>
              )}
            </section>

          </>
        )}
      </div>
    </AppShell>
  );
}
