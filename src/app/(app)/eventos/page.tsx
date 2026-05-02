import Link from "next/link";
import { endOfWeek, isAfter, isBefore, isToday, startOfDay, subDays } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { EmptyState, SectionTitle, priorityCardClass } from "@/components/cards";
import { Badge } from "@/components/ui/badge";
import { summarizeEventPresence } from "@/features/events/presence-summary";
import { canCheckInEvent, getVisibleEventWhere, type PermissionUser } from "@/features/permissions/permissions";
import { cn } from "@/lib/cn";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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
    include: { group: true, attendances: true },
    orderBy: { startsAt: "asc" },
    take: 80,
  });
}
type EventWithRelations = Awaited<ReturnType<typeof getEventsForUser>>[number];

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

  if (!groupName) return `Evento geral · ${dateTime}`;

  const normalizedTitle = normalizeEventText(event.title);
  const normalizedGroup = normalizeEventText(groupName);
  const titleAlreadyIdentifiesGroup = normalizedTitle === normalizedGroup || normalizedTitle.includes(normalizedGroup);

  return titleAlreadyIdentifiesGroup ? dateTime : `${groupName} · ${dateTime}`;
}

function EventCard({ event, user, now }: { event: EventWithRelations; user: PermissionUser; now: Date }) {
  const metrics = summarizeEventPresence(event);
  const isFutureEvent = isAfter(event.startsAt, now);
  const isPendingEvent = !metrics.completed && !isFutureEvent;
  const canEditPresence = canCheckInEvent(user, event);
  const canRegisterPresence = canEditPresence && !metrics.completed;
  const canAdjustPresence = canEditPresence && metrics.completed;
  const label = metrics.completed
    ? "Presença registrada"
    : isFutureEvent
      ? "Agendado"
      : canRegisterPresence
        ? "Presença pendente"
        : "Aguardando registro";
  const badgeTone = metrics.completed ? "ok" : isFutureEvent ? "info" : "warn";
  const actionLabel = canRegisterPresence
    ? "Registrar presença"
    : canAdjustPresence
      ? "Ajustar presença"
      : metrics.completed
        ? "Ver resumo"
        : "Ver encontro";

  return (
    <article className={cn("event-card", metrics.completed && "event-card-registered", priorityCardClass(metrics.completed ? "care" : isPendingEvent ? "warn" : undefined))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {eventMeta(event)}
          </p>
        </div>
        <Badge tone={badgeTone} className="event-card-badge">{label}</Badge>
      </div>

      {metrics.completed ? (
        <div className="event-card-stats">
          <p>
            <strong className="text-[var(--color-metric-presenca)]">{metrics.hasPresenceData ? `${metrics.presenceRate}%` : "—"}</strong>
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

export default async function EventsPage() {
  const user = await getCurrentUser();
  const now = new Date();
  const events = await getEventsForUser(user, now);
  const isPastorLike = user.role === "PASTOR" || user.role === "ADMIN";
  const secondaryNavHref = isPastorLike ? "/equipe" : "/pessoas";
  const secondaryNavLabel = isPastorLike ? "Equipe" : user.role === "LEADER" ? "Membros" : "Pessoas";

  const today = startOfDay(now);
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const pendingPresenceEvents = events
    .filter((event) => !summarizeEventPresence(event).completed && !isAfter(event.startsAt, now))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  const pendingPresenceEventIds = new Set(pendingPresenceEvents.map((event) => event.id));
  const todayEvents = events.filter((event) => isToday(event.startsAt) && !pendingPresenceEventIds.has(event.id));
  const weekEvents = events.filter((event) => !isToday(event.startsAt) && isAfter(event.startsAt, now) && isBefore(event.startsAt, weekEnd));
  const completedEvents = events
    .filter((event) => summarizeEventPresence(event).completed && isBefore(event.startsAt, today))
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: secondaryNavHref, label: secondaryNavLabel, icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar", active: true },
      ]}
      compactHeader
    >
      <div className="events-page">
        <h2 className="events-title">Encontros</h2>
        <p className="events-description">
          Presença pendente primeiro; encontros agendados e registros recentes ficam logo abaixo.
        </p>

        {pendingPresenceEvents.length > 0 ? (
          <>
            <SectionTitle>Presença pendente</SectionTitle>
            <div className="space-y-3">
              {pendingPresenceEvents.map((event) => <EventCard key={event.id} event={event} user={user} now={now} />)}
            </div>
          </>
        ) : null}

        <SectionTitle>Hoje</SectionTitle>
        <div className="space-y-3">
          {todayEvents.length > 0 ? todayEvents.map((event) => <EventCard key={event.id} event={event} user={user} now={now} />) : (
            <EmptyState>Nenhum evento previsto para hoje.</EmptyState>
          )}
        </div>

        <SectionTitle>Esta semana</SectionTitle>
        <div className="space-y-3">
          {weekEvents.length > 0 ? weekEvents.map((event) => <EventCard key={event.id} event={event} user={user} now={now} />) : (
            <EmptyState>Nenhum outro evento desta semana.</EmptyState>
          )}
        </div>

        <SectionTitle>Presença já registrada</SectionTitle>
        <div className="space-y-3">
          {completedEvents.length > 0 ? completedEvents.slice(0, 5).map((event) => <EventCard key={event.id} event={event} user={user} now={now} />) : (
            <EmptyState>Nenhuma presença registrada recentemente.</EmptyState>
          )}
        </div>
      </div>
    </AppShell>
  );
}
