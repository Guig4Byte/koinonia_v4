import Link from "next/link";
import { BackLink, EmptyState, SectionTitle } from "@/components/base-cards";
import { priorityCardClass } from "@/components/card-priority";
import { ProgressiveList } from "@/components/progressive-list";
import { Badge } from "@/components/ui/badge";
import { formatPresenceRate } from "@/features/events/presence-display";
import {
  buildEventListCardState,
  buildEventsConsultationView,
  eventMeta,
  eventPeriodLabel,
  EVENT_LIST_LIMIT,
  type EventConsultationMode,
  type EventListEvent,
  type EventPeriod,
} from "@/features/events/events-page-view";
import type { PermissionUser } from "@/features/permissions/permissions";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

export function EventCard({ event, user, now }: { event: EventListEvent; user: PermissionUser; now: Date }) {
  const state = buildEventListCardState(event, user, now);
  const { metrics } = state;

  return (
    <article className={cn(
      "event-card",
      state.recordedPresence && "event-card-registered priority-card event-card-registered-ok",
      priorityCardClass(state.isPendingEvent ? "warn" : undefined),
    )}>
      <div className="k-card-header-row">
        <div className="min-w-0">
          <p className="k-item-title">{event.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {eventMeta(event)}
          </p>
          {state.locationName ? (
            <p className="k-item-detail-tight">
              {state.locationName}
            </p>
          ) : null}
        </div>
        <Badge tone={state.badgeTone} className="event-card-badge">{state.label}</Badge>
      </div>

      {state.recordedPresence ? (
        <div className="event-card-stats">
          <p>
            <strong className="text-[var(--color-metric-presenca)]">{formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}</strong>
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
        href={ROUTES.event(event.id)}
        className={cn(
          "event-card-action",
          state.canRegisterPresence ? "event-card-action-primary" : "event-card-action-secondary",
        )}
      >
        {state.actionLabel} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

export function EventList({ events, user, now, limit = EVENT_LIST_LIMIT }: { events: EventListEvent[]; user: PermissionUser; now: Date; limit?: number }) {
  return (
    <ProgressiveList initialCount={limit} step={EVENT_LIST_LIMIT} moreLabel="Ver mais encontros">
      {events.map((event) => <EventCard key={event.id} event={event} user={user} now={now} />)}
    </ProgressiveList>
  );
}

function ConsultationCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link href={href} className="card-hover-lift block rounded-[1.15rem] border border-[var(--color-border-card)] bg-[var(--color-bg-card)] p-4 shadow-card transition active:scale-[0.99]">
      <p className="k-item-title">{title}</p>
      <p className="k-supporting-copy">{description}</p>
      <p className="mt-3 text-sm font-semibold text-[var(--color-brand)]">Consultar →</p>
    </Link>
  );
}

export function EventConsultationCards() {
  return (
    <div className="space-y-3">
      <ConsultationCard
        href={ROUTES.eventsConsultation("sem-presenca", "semana")}
        title="Sem presença registrada"
        description="Alguns encontros podem já ter acontecido, mas ainda não têm presença marcada."
      />
      <ConsultationCard
        href={ROUTES.eventsConsultation("historico", "semana")}
        title="Histórico de presença"
        description="Consulte encontros já registrados por período."
      />
    </div>
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
            href={ROUTES.eventsConsultation(mode, period)}
            className={cn(
              "rounded-full border px-3 py-2 text-xs font-semibold transition active:scale-[0.98]",
              active
                ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]"
                : "border-[var(--color-border-card)] bg-[var(--surface-alt)] text-[var(--color-text-secondary)]",
            )}
          >
            {eventPeriodLabel(period)}
          </Link>
        );
      })}
    </div>
  );
}

export function EventsConsultationView({
  mode,
  period,
  events,
  user,
  now,
}: {
  mode: EventConsultationMode;
  period: EventPeriod;
  events: EventListEvent[];
  user: PermissionUser;
  now: Date;
}) {
  const view = buildEventsConsultationView({ mode, period, events, now });

  return (
    <>
      <BackLink href={ROUTES.events}>Encontros</BackLink>
      <h2 className="events-title">{view.title}</h2>
      <p className="events-description">{view.description}</p>
      <PeriodChips mode={mode} activePeriod={period} />
      <SectionTitle>{view.periodLabel}</SectionTitle>
      {view.filteredEvents.length > 0 ? <EventList events={view.filteredEvents} user={user} now={now} /> : <EmptyState>{view.emptyMessage}</EmptyState>}
    </>
  );
}
