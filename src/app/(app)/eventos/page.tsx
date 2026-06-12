import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/shared/base-cards";
import { SectionHeader } from "@/components/ui/section-header";
import { PageHero } from "@/components/shared/page-hero";
import { EventConsultationCards, EventList, EventsConsultationView } from "@/features/events/components/events-page-sections";
import { PastCellMeetingAction } from "@/features/events/components/past-cell-meeting-action";
import { EMPTY_STATE_COPY } from "@/features/empty-states/empty-state-copy";
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
import { leaderCellHrefForUser } from "@/features/navigation/leader-cell-nav";
import { getVisibleEventWhere, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { EventType, GroupKind, UserRole } from "@/generated/prisma/client";
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

const NO_RECORDED_PRESENCE_LABEL = "Ainda sem presença registrada";

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
    orderBy: { startsAt: "desc" },
    take: EVENTS_PAGE_QUERY_LIMIT,
  });
}

async function getLeaderCellsForPastMeetingAction(user: PermissionUser, referenceDate: Date) {
  if (user.role !== UserRole.LEADER) return [];

  const cells = await prisma.smallGroup.findMany({
    where: {
      ...getVisibleGroupWhere(user),
      kind: GroupKind.CELL,
    },
    select: {
      id: true,
      name: true,
      locationName: true,
      meetingTime: true,
      events: {
        where: {
          type: EventType.CELL_MEETING,
          startsAt: { lte: referenceDate },
          attendances: { some: {} },
        },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return cells.map(({ events: presenceHistoryEvents, ...cell }) => ({
    ...cell,
    statusLabel: presenceHistoryEvents.length > 0
      ? undefined
      : NO_RECORDED_PRESENCE_LABEL,
  }));
}

export default async function EventsPage({ searchParams }: { searchParams?: EventsSearchParams }) {
  const user = await getCurrentUser();
  const now = new Date();
  await ensureUpcomingCellMeetingsForUser(user, { referenceDate: now });

  const [events, leaderCellHref, leaderCells] = await Promise.all([
    getEventsForUser(user, now),
    leaderCellHrefForUser(user),
    getLeaderCellsForPastMeetingAction(user, now),
  ]);
  const resolvedSearchParams: Awaited<EventsSearchParams> = searchParams ? await searchParams : {};
  const mode = readEventConsultationMode(firstParam(resolvedSearchParams.consulta));
  const period = readEventPeriod(firstParam(resolvedSearchParams.periodo));
  const { todayEvents, weekEvents } = buildEventsHomeSections(events, now);
  const consultationSummary = buildEventsConsultationSummary(events, now);

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events", secondaryHref: leaderCellHref })}
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
            <PastCellMeetingAction groups={leaderCells} />

            <section className={pageStyles.eventsHomeSection}>
              <SectionHeader title="Hoje" className={pageStyles.eventsHomeSectionTitle} />
              {todayEvents.length > 0 ? (
                <EventList events={todayEvents} user={user} now={now} />
              ) : (
                <EmptyState title={EMPTY_STATE_COPY.events.noTodayTitle}>{EMPTY_STATE_COPY.events.noTodayDetail}</EmptyState>
              )}
            </section>

            <section className={pageStyles.eventsHomeSection}>
              <SectionHeader title="Próximos encontros" className={pageStyles.eventsHomeSectionTitle} />
              {weekEvents.length > 0 ? (
                <EventList events={weekEvents} user={user} now={now} />
              ) : (
                <EmptyState title={EMPTY_STATE_COPY.events.noUpcomingTitle}>{EMPTY_STATE_COPY.events.noUpcomingDetail}</EmptyState>
              )}
            </section>

          </>
        )}
      </div>
    </AppShell>
  );
}
