import { BackLink, EmptyState, SectionTitle } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ArrowRight, CalendarClock, ClipboardCheck, MapPin, type LucideIcon } from "lucide-react";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { ButtonLink } from "@/components/ui/button-link";
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
      priorityTone={state.isPendingEvent ? "warn" : state.recordedPresence ? "stable" : undefined}
      data-testid="event-card"
      className={cn(
        styles.card,
        "group",
        state.recordedPresence && styles.registered,
      )}
    >
      <CardHeader
        className={styles.header}
        title={event.title}
        subtitle={eventMeta(event)}
        detail={state.locationName ? (
          <span className={styles.locationLine}>
            <MapPin className={styles.locationIcon} aria-hidden="true" />
            <span className="min-w-0 truncate">{state.locationName}</span>
          </span>
        ) : null}
        badgeLabel={state.label}
        badgeTone={state.badgeTone}
        badgeClassName={styles.badge}
        titleClassName={styles.title}
        subtitleClassName={styles.meta}
        detailClassName={styles.location}
      />

      {state.recordedPresence ? (
        <div className={styles.stats} data-testid="event-card-stats">
          <p className={styles.stat}>
            <strong className="text-[color:var(--color-metric-presenca)]">{formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}</strong>
            <span>presença</span>
          </p>
          <p className={styles.stat}>
            <strong className="text-[color:var(--color-metric-visitantes)]">{metrics.visitorCount}</strong>
            <span>{metrics.visitorCount === 1 ? "visitante" : "visitantes"}</span>
          </p>
          <p className={styles.stat}>
            <strong className="text-[color:var(--color-text-primary)]">{metrics.markingsCount}</strong>
            <span>marcações</span>
          </p>
        </div>
      ) : null}

      <span className={styles.footer}>
        <span className={cn(styles.action, state.canRegisterPresence && styles.actionPrimary)} data-testid="event-card-action">
          {state.actionLabel}
          <ArrowRight className={styles.actionIcon} aria-hidden="true" />
        </span>
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

function ConsultationCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <CardLink href={href} padding="sm" className={cn(styles.consultationCard, "group")} aria-label={`${title}: ${description}`}>
      <span className={styles.consultationIcon} aria-hidden="true">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className={styles.consultationTitle}>{title}</span>
        <span className={styles.consultationDescription}>{description}</span>
      </span>
      <span className={styles.consultationArrow} aria-hidden="true">
        <ArrowRight className="h-4 w-4" />
      </span>
    </CardLink>
  );
}

export function EventConsultationCards() {
  return (
    <nav className={styles.consultationActions} aria-label="Consultas de encontros">
      <ConsultationCard
        href={eventsConsultationSectionHref("sem-presenca", "semana")}
        title="Sem presença"
        description="Pendentes da semana"
        icon={ClipboardCheck}
      />
      <ConsultationCard
        href={eventsConsultationSectionHref("historico", "semana")}
        title="Histórico"
        description="Presenças registradas"
        icon={CalendarClock}
      />
    </nav>
  );
}

function PeriodChips({ mode, activePeriod }: { mode: EventConsultationMode; activePeriod: EventPeriod }) {
  const periods: EventPeriod[] = mode === "historico" ? ["semana", "semana-passada", "30d"] : ["semana", "30d"];

  return (
    <div className="k-filter-row">
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
      <PageHero
        compact
        eyebrow="Consulta"
        title={view.title}
        description={view.description}
      />
      <section id={EVENTS_CONSULTATION_SECTION_ID} className="scroll-mt-6">
        <PeriodChips mode={mode} activePeriod={period} />
        <SectionTitle>{view.periodLabel}</SectionTitle>
        {view.filteredEvents.length > 0 ? (
          <EventList events={view.filteredEvents} user={user} now={now} />
        ) : (
          <EmptyState
            title={mode === "historico" ? "Nenhum histórico neste período" : "Tudo em dia neste período"}
            action={(
              <ButtonLink href={ROUTES.events} variant="quiet" size="sm" className="rounded-full">
                Voltar para encontros
              </ButtonLink>
            )}
          >
            {view.emptyMessage}
          </EmptyState>
        )}
      </section>
    </>
  );
}
