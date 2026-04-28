import Link from "next/link";
import { endOfWeek, isAfter, isBefore, isToday, startOfDay, startOfWeek } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { SectionTitle } from "@/components/cards";
import { SearchBox } from "@/components/search-box";
import { Badge } from "@/components/ui/badge";
import { canCheckInEvent, getVisibleEventWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { formatShortDate, formatTime, percent } from "@/lib/format";
import { prisma } from "@/lib/prisma";

async function getEventsForUser(user: PermissionUser) {
  return prisma.event.findMany({
    where: getVisibleEventWhere(user),
    include: { group: true, attendances: true },
    orderBy: { startsAt: "asc" },
    take: 30,
  });
}
type EventWithRelations = Awaited<ReturnType<typeof getEventsForUser>>[number];

function eventMetrics(event: EventWithRelations) {
  const accountable = event.attendances.filter((attendance) => attendance.status !== "VISITOR");
  const present = accountable.filter((attendance) => attendance.status === "PRESENT").length;
  const visitors = event.attendances.filter((attendance) => attendance.status === "VISITOR").length;

  return {
    rate: percent(present, accountable.length),
    visitors,
    markings: event.attendances.length,
    completed: event.status === "COMPLETED" || event.attendances.length > 0,
  };
}

function EventCard({ event, user }: { event: EventWithRelations; user: PermissionUser }) {
  const metrics = eventMetrics(event);
  const canEditPresence = canCheckInEvent(user, event);
  const canRegisterPresence = canEditPresence && !metrics.completed;
  const canAdjustPresence = canEditPresence && metrics.completed;
  const label = metrics.completed ? "presença registrada" : canRegisterPresence ? "presença pendente" : "aguardando líder";

  return (
    <article className="rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--color-text-primary)]">{event.title}</p>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {event.group?.name ?? "Evento geral"} · {formatShortDate(event.startsAt)}, {formatTime(event.startsAt)}
          </p>
        </div>
        <Badge tone={metrics.completed ? "ok" : "warn"}>{label}</Badge>
      </div>

      {metrics.completed ? (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-metric-presenca)]">{metrics.rate}%</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">presença</p>
          </div>
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-metric-visitantes)]">{metrics.visitors}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">visitantes</p>
          </div>
          <div className="rounded-2xl bg-[var(--metric-card-bg)] p-3">
            <p className="text-lg font-bold text-[var(--color-text-primary)]">{metrics.markings}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">marcações</p>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {canRegisterPresence
            ? "Marque quem veio. A presença ajuda o Koinonia a perceber quem pode precisar de cuidado."
            : "O líder da célula registra a presença. Aqui você acompanha o resumo do encontro."}
        </p>
      )}

      <Link
        href={`/eventos/${event.id}`}
        className="k-primary-action mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold transition active:scale-[0.98]"
      >
        {canRegisterPresence ? "Registrar presença" : canAdjustPresence ? "Ajustar presença" : "Ver resumo"}
      </Link>
    </article>
  );
}

export default async function EventsPage() {
  const user = await getCurrentUser();
  const events = await getEventsForUser(user);

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const todayEvents = events.filter((event) => isToday(event.startsAt));
  const weekEvents = events.filter((event) => !isToday(event.startsAt) && isAfter(event.startsAt, weekStart) && isBefore(event.startsAt, weekEnd));
  const completedEvents = events.filter((event) => eventMetrics(event).completed && isBefore(event.startsAt, today));

  return (
    <AppShell
      userName={user.name}
      role={user.role}
      nav={[
        { href: user.role === "LEADER" ? "/lider" : user.role === "SUPERVISOR" ? "/supervisor" : "/pastor", label: "Visão", icon: "home" },
        { href: "/pessoas", label: "Pessoas", icon: "people" },
        { href: "/eventos", label: "Eventos", icon: "calendar", active: true },
        { href: "#buscar", label: "Busca", icon: "search" },
      ]}
    >
      <SearchBox placeholder="Buscar pessoa..." />
      <h2 className="mb-2 text-2xl font-semibold text-[var(--color-text-primary)]">Eventos</h2>
      <p className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        Acompanhe os encontros da semana sem transformar cuidado em relatório.
      </p>

      <SectionTitle>Hoje</SectionTitle>
      <div className="space-y-3">
        {todayEvents.length > 0 ? todayEvents.map((event) => <EventCard key={event.id} event={event} user={user} />) : (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum evento previsto para hoje.
          </p>
        )}
      </div>

      <SectionTitle>Esta semana</SectionTitle>
      <div className="space-y-3">
        {weekEvents.length > 0 ? weekEvents.map((event) => <EventCard key={event.id} event={event} user={user} />) : (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum outro evento desta semana.
          </p>
        )}
      </div>

      <SectionTitle>Já realizados</SectionTitle>
      <div className="space-y-3">
        {completedEvents.length > 0 ? completedEvents.slice(0, 5).map((event) => <EventCard key={event.id} event={event} user={user} />) : (
          <p className="rounded-2xl border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 text-sm text-[var(--color-text-secondary)] shadow-card">
            Nenhum encontro realizado recentemente.
          </p>
        )}
      </div>
    </AppShell>
  );
}
