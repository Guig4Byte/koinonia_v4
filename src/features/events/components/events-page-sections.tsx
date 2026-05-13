import { BackLink, EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { priorityCardClass } from "@/lib/card-priority";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { buttonClassName } from "@/components/ui/button";
import { CardHeader } from "@/components/ui/card-header";
import { CardLink } from "@/components/ui/card-link";
import { FilterChip } from "@/components/ui/filter-chip";
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
import pageStyles from "@/components/shared/consultation-page.module.css";
import styles from "./events-page-sections.module.css";

const EVENTS_CONSULTATION_SECTION_ID = "eventos-consulta";

function eventsConsultationSectionHref(mode: EventConsultationMode, period: EventPeriod) {
  return `${ROUTES.eventsConsultation(mode, period)}#${EVENTS_CONSULTATION_SECTION_ID}`;
}

export function EventCard({ event, user, now }: { event: EventListEvent; user: PermissionUser; now: Date }) {
  const state = buildEventListCardState(event, user, now);
  const { metrics } = state;

  return (
    <CardLink
      href={ROUTES.event(event.id)}
      aria-label={`${state.actionLabel}: ${event.title}`}
      padding="sm"
      className={cn(
        styles.card,
        "group",
        state.recordedPresence && cn(styles.registered, "priority-card"),
        priorityCardClass(state.isPendingEvent ? "warn" : undefined),
      )}
    >
      <CardHeader
        title={event.title}
        subtitle={eventMeta(event)}
        detail={state.locationName}
        badgeLabel={state.label}
        badgeTone={state.badgeTone}
        badgeClassName={styles.badge}
      />

      {state.recordedPresence ? (
        <div className={styles.stats}>
          <p>
            <strong className="text-[color:var(--color-metric-presenca)]">{formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}</strong>
            <span>presença</span>
          </p>
          <p>
            <strong className="text-[color:var(--color-metric-visitantes)]">{metrics.visitorCount}</strong>
            <span>{metrics.visitorCount === 1 ? "visitante" : "visitantes"}</span>
          </p>
          <p>
            <strong className="text-[color:var(--color-text-primary)]">{metrics.markingsCount}</strong>
            <span>marcações</span>
          </p>
        </div>
      ) : null}

      <span
        className={buttonClassName({
          variant: state.canRegisterPresence ? "primaryFlat" : "secondary",
          size: "sm",
          className: cn(
            "mt-3 rounded-full px-4 py-0 text-[length:var(--text-sm)] font-extrabold",
            state.recordedPresence && "mt-2",
          ),
        })}
      >
        {state.actionLabel} <span className="inline-block transition group-active:translate-x-0.5" aria-hidden="true">→</span>
      </span>
    </CardLink>
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
    <CardLink href={href}>
      <p className="k-item-title">{title}</p>
      <p className="k-supporting-copy">{description}</p>
      <p className="mt-3 text-[length:var(--text-sm)] font-semibold text-[color:var(--color-brand)]">Consultar →</p>
    </CardLink>
  );
}

export function EventConsultationCards() {
  return (
    <div className="space-y-3">
      <ConsultationCard
        href={eventsConsultationSectionHref("sem-presenca", "semana")}
        title="Sem presença registrada"
        description="Alguns encontros podem já ter acontecido, mas ainda não têm presença marcada."
      />
      <ConsultationCard
        href={eventsConsultationSectionHref("historico", "semana")}
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
          <FilterChip
            key={period}
            href={eventsConsultationSectionHref(mode, period)}
            active={active}
            variant="period"
          >
            {eventPeriodLabel(period)}
          </FilterChip>
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
      <h2 className={pageStyles.title}>{view.title}</h2>
      <p className={cn(pageStyles.description, pageStyles.eventsIntro)}>{view.description}</p>
      <section id={EVENTS_CONSULTATION_SECTION_ID} className="scroll-mt-6">
        <PeriodChips mode={mode} activePeriod={period} />
        <SectionTitle>{view.periodLabel}</SectionTitle>
        {view.filteredEvents.length > 0 ? <EventList events={view.filteredEvents} user={user} now={now} /> : <EmptyState>{view.emptyMessage}</EmptyState>}
      </section>
    </>
  );
}
