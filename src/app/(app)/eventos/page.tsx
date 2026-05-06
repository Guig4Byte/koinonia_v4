import Link from "next/link";
import { endOfWeek, isAfter, isToday, startOfDay, startOfWeek, subDays } from "date-fns";
import { EventStatus } from "../../../generated/prisma/client";
import { AppShell } from "@/components/app-shell";
import { appNavForRole } from "@/features/navigation/app-nav";
import { EmptyState, SectionTitle, priorityCardClass } from "@/components/cards";
import { ProgressiveList } from "@/components/progressive-list";
import { Badge } from "@/components/ui/badge";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { ensureUpcomingCellMeetingsForUser } from "@/features/events/schedule";
import { canCheckInEvent, getVisibleEventWhere, type PermissionUser } from "@/features/permissions/permissions";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

const EVENT_LIST_LIMIT = 4;

type EventsSearchParams = Promise<{
  consulta?: string | string[];
  periodo?: string | string[];
}>;

type EventConsultationMode = "sem-presenca" | "historico";
type EventPeriod = "semana" | "semana-passada" | "30d";

async function getEventsForUser(user: PermissionUser, referenceDate: Date) {
  const today = startOfDay(referenceDate);
  const historyStart = subDays(today, 60);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  return prisma.event.findMany({
    where: {
      AND: [
        getVisibleEventWhere(user),
        { startsAt: { gte: historyStart, lte: weekEnd } },
      ],
    },
    include: { group: { include: { responsibilities: { where: { activeUntil: null } } } }, attendances: true },
    orderBy: { startsAt: "asc" },
    take: 120,
  });
}
type EventWithRelations = Awaited<ReturnType<typeof getEventsForUser>>[number];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeEventText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function eventMeta(event: EventWithRelations) {
  const dateTime = `${formatShortDate(event.startsAt)}, ${formatTime(event.startsAt)}`;
  const groupName = event.group?.name;

  if (!groupName) return `Encontro geral · ${dateTime}`;

  const normalizedTitle = normalizeEventText(event.title);
  const normalizedGroup = normalizeEventText(groupName);
  const titleAlreadyIdentifiesGroup = normalizedTitle === normalizedGroup || normalizedTitle.includes(normalizedGroup);

  return titleAlreadyIdentifiesGroup ? dateTime : `${groupName} · ${dateTime}`;
}

function eventLocation(event: EventWithRelations) {
  return event.locationName ?? event.group?.locationName ?? null;
}

function hasRecordedPresence(event: EventWithRelations) {
  return summarizeEventPresence(event).hasPresenceData;
}

function isClosedWithoutPresence(event: EventWithRelations) {
  return event.status === EventStatus.CANCELLED || event.status === EventStatus.NO_MEETING;
}

function closedWithoutPresenceLabel(event: EventWithRelations) {
  if (event.status === EventStatus.CANCELLED) return "Cancelado";
  if (event.status === EventStatus.NO_MEETING) return "Não houve encontro";
  return "Ver encontro";
}

function isWithinPeriod(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function periodRange(period: EventPeriod, now: Date) {
  const today = startOfDay(now);
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });

  if (period === "semana-passada") {
    const lastWeekStart = subDays(currentWeekStart, 7);
    const lastWeekEnd = subDays(currentWeekEnd, 7);
    return { start: lastWeekStart, end: lastWeekEnd };
  }

  if (period === "30d") {
    return { start: subDays(today, 30), end: now };
  }

  return { start: currentWeekStart, end: currentWeekEnd };
}

function periodLabel(period: EventPeriod) {
  if (period === "semana-passada") return "Semana passada";
  if (period === "30d") return "Últimos 30 dias";
  return "Esta semana";
}

function EventCard({ event, user, now }: { event: EventWithRelations; user: PermissionUser; now: Date }) {
  const metrics = summarizeEventPresence(event);
  const recordedPresence = metrics.hasPresenceData;
  const isCancelledEvent = isClosedWithoutPresence(event);
  const isFutureEvent = isAfter(event.startsAt, now);
  const isPendingEvent = !isCancelledEvent && !recordedPresence && !isFutureEvent;
  const canEditPresence = !isCancelledEvent && canCheckInEvent(user, event);
  const canRegisterPresence = canEditPresence && !recordedPresence;
  const label = isCancelledEvent
    ? closedWithoutPresenceLabel(event)
    : recordedPresence
      ? "Presença registrada"
      : isFutureEvent
        ? "Agendado"
        : canRegisterPresence
          ? "Presença pendente"
          : "Aguardando registro";
  const badgeTone = isCancelledEvent ? "neutral" : recordedPresence ? "ok" : isFutureEvent ? "info" : "warn";
  const actionLabel = canRegisterPresence
    ? "Registrar presença"
    : recordedPresence
      ? "Ver resumo"
      : "Ver encontro";
  const locationName = eventLocation(event);

  return (
    <article className={cn(
      "event-card",
      recordedPresence && "event-card-registered priority-card event-card-registered-ok",
      priorityCardClass(isPendingEvent ? "warn" : undefined),
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {eventMeta(event)}
          </p>
          {locationName ? (
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {locationName}
            </p>
          ) : null}
        </div>
        <Badge tone={badgeTone} className="event-card-badge">{label}</Badge>
      </div>

      {recordedPresence ? (
        <div className="event-card-stats">
          <p>
            <strong className="text-[var(--color-metric-presenca)]">{metrics.presenceRate}%</strong>
            <span>presença</span>
          </p>
          <p>
            <strong className="text-[var(--color-metric-visitantes)]">{metrics.visitorCount}</strong>
            <span>{metrics.visitorCount === 1 ? "visitante" : "visitantes"}</span>
          </p>
          <p>
            <strong className="text-[var(--color-text-primary)]">{metrics.markingsCount}</strong>
            <span>marcações</span>
          </p>
        </div>
      ) : null}

      <Link
        href={`/eventos/${event.id}`}
        className={cn(
          "event-card-action",
          canRegisterPresence ? "event-card-action-primary" : "event-card-action-secondary",
        )}
      >
        {actionLabel} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function EventList({ events, user, now, limit = EVENT_LIST_LIMIT }: { events: EventWithRelations[]; user: PermissionUser; now: Date; limit?: number }) {
  return (
    <ProgressiveList initialCount={limit} step={EVENT_LIST_LIMIT} moreLabel="Ver mais encontros">
      {events.map((event) => <EventCard key={event.id} event={event} user={user} now={now} />)}
    </ProgressiveList>
  );
}

function ConsultationCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
      <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{description}</p>
      <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">Consultar →</p>
    </Link>
  );
}

function PeriodChips({ mode, activePeriod }: { mode: EventConsultationMode; activePeriod: EventPeriod }) {
  const periods: EventPeriod[] = mode === "historico" ? ["semana", "semana-passada", "30d"] : ["semana", "30d"];

  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => {
        const active = period === activePeriod;
        return (
          <Link
            key={period}
            href={`/eventos?consulta=${mode}&periodo=${period}`}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.98]",
              active
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                : "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[var(--color-text-secondary)]",
            )}
          >
            {periodLabel(period)}
          </Link>
        );
      })}
    </div>
  );
}

function EventsConsultationView({
  mode,
  period,
  events,
  user,
  now,
}: {
  mode: EventConsultationMode;
  period: EventPeriod;
  events: EventWithRelations[];
  user: PermissionUser;
  now: Date;
}) {
  const { start, end } = periodRange(period, now);
  const filteredEvents = events
    .filter((event) => isWithinPeriod(event.startsAt, start, end))
    .filter((event) => {
      const recordedPresence = hasRecordedPresence(event);
      if (mode === "historico") return recordedPresence;
      return !isClosedWithoutPresence(event) && !recordedPresence && !isAfter(event.startsAt, now);
    })
    .sort((a, b) => {
      if (mode === "historico") return b.startsAt.getTime() - a.startsAt.getTime();
      return b.startsAt.getTime() - a.startsAt.getTime();
    });

  const title = mode === "historico" ? "Histórico de presença" : "Sem presença registrada";
  const description = mode === "historico"
    ? "Consulte encontros já registrados por período."
    : "Alguns encontros ainda não têm presença registrada. Talvez já tenham acontecido, mas a presença ainda não foi marcada.";
  const emptyMessage = mode === "historico"
    ? "Nenhuma presença registrada neste período."
    : "Nenhum encontro sem presença registrada neste período.";

  return (
    <>
      <Link href="/eventos" className="mb-4 inline-flex min-h-9 items-center text-sm font-semibold text-[var(--color-brand)] transition active:scale-[0.98]">
        ← Encontros
      </Link>
      <h2 className="events-title">{title}</h2>
      <p className="events-description">{description}</p>
      <PeriodChips mode={mode} activePeriod={period} />
      <SectionTitle>{periodLabel(period)}</SectionTitle>
      {filteredEvents.length > 0 ? <EventList events={filteredEvents} user={user} now={now} /> : <EmptyState>{emptyMessage}</EmptyState>}
    </>
  );
}

export default async function EventsPage({ searchParams }: { searchParams?: EventsSearchParams }) {
  const user = await getCurrentUser();
  const now = new Date();
  await ensureUpcomingCellMeetingsForUser(user, { referenceDate: now });
  const events = await getEventsForUser(user, now);
  const resolvedSearchParams: Awaited<EventsSearchParams> = searchParams ? await searchParams : {};
  const rawMode = firstParam(resolvedSearchParams.consulta);
  const mode: EventConsultationMode | null = rawMode === "sem-presenca" || rawMode === "historico" ? rawMode : null;
  const rawPeriod = firstParam(resolvedSearchParams.periodo);
  const period: EventPeriod = rawPeriod === "semana-passada" || rawPeriod === "30d" ? rawPeriod : "semana";

  const today = startOfDay(now);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayEvents = events
    .filter((event) => isToday(event.startsAt))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const weekEvents = events
    .filter((event) => {
      if (isToday(event.startsAt) || !isWithinPeriod(event.startsAt, weekStart, weekEnd)) return false;

      return !isClosedWithoutPresence(event) && isAfter(event.startsAt, now) && !hasRecordedPresence(event);
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={appNavForRole(user, { active: "events" })}
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
            <div className="space-y-3">
              <ConsultationCard
                href="/eventos?consulta=sem-presenca&periodo=semana"
                title="Sem presença registrada"
                description="Alguns encontros podem já ter acontecido, mas ainda não têm presença marcada."
              />
              <ConsultationCard
                href="/eventos?consulta=historico&periodo=semana"
                title="Histórico de presença"
                description="Consulte encontros já registrados por período."
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
