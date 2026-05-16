import { EmptyState } from "@/components/shared/base-cards";
import { PageHero } from "@/components/shared/page-hero";
import { ArrowRight, CalendarDays, CalendarClock, ClipboardCheck, Clock3, MapPin, UsersRound, type LucideIcon } from "lucide-react";
import { ProgressiveList } from "@/components/shared/progressive-list";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { CardHeader } from "@/components/ui/card-header";
import { CardLink } from "@/components/ui/card-link";
import { FilterChip } from "@/components/ui/filter-chip";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { clampPresenceRate, presenceIndicatorStyle, PresenceMetricDisplay } from "@/components/shared/presence-metric";
import {
  buildEventListCardState,
  buildEventsConsultationView,
  eventDateTimeLabel,
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

type EventCardVariant = "default" | "pendingConsultation" | "historyConsultation";

function eventsConsultationSectionHref(mode: EventConsultationMode, period: EventPeriod) {
  return `${ROUTES.eventsConsultation(mode, period)}#${EVENTS_CONSULTATION_SECTION_ID}`;
}

export function EventCard({
  event,
  user,
  now,
  variant = "default",
}: {
  event: EventListEvent;
  user: PermissionUser;
  now: Date;
  variant?: EventCardVariant;
}) {
  const state = buildEventListCardState(event, user, now);
  const { metrics } = state;
  const isPendingConsultation = variant === "pendingConsultation" && state.isPendingEvent;
  const isHistoryConsultation = variant === "historyConsultation" && state.recordedPresence;
  const consultationTitle = event.group?.name ?? event.title;
  const safePresenceRate = clampPresenceRate(metrics.presenceRate);
  const historyTone = presenceTone(metrics.hasPresenceData, metrics.presenceRate);

  if (isPendingConsultation) {
    return (
      <CardLink
        href={ROUTES.event(event.id)}
        aria-label={`${state.actionLabel}: ${event.title}`}
        padding="sm"
        priorityTone="warn"
        data-testid="event-card"
        className={cn(styles.card, styles.pendingConsultationCard, "group")}
      >
        <div className={styles.pendingContent}>
          <span className={styles.pendingIconWrap} aria-hidden="true">
            <UsersRound className={styles.pendingIcon} />
          </span>

          <div className={styles.pendingBody}>
            <div className={styles.pendingHeader}>
              <p className={cn(styles.title, styles.pendingTitle)}>{consultationTitle}</p>
              <Badge tone={state.badgeTone} className={cn(styles.badge, styles.pendingBadge)}>Pendente</Badge>
            </div>

            <p className={styles.pendingMeta}>
              <span className={styles.pendingMetaLine}>
                <span className={styles.pendingMetaItem}>
                  <CalendarDays className={styles.pendingMetaIcon} aria-hidden="true" />
                  {eventDateTimeLabel(event)}
                </span>
                {state.pendingAgeLabel ? (
                  <span className={styles.pendingAge}>
                    <Clock3 className={styles.pendingMetaIcon} aria-hidden="true" />
                    {state.pendingAgeLabel}
                  </span>
                ) : null}
              </span>
            </p>

            {state.locationName ? (
              <div className={styles.pendingLocation}>
                <span className={styles.pendingLocationLine}>
                  <MapPin className={styles.locationIcon} aria-hidden="true" />
                  <span className="min-w-0 truncate">{state.locationName}</span>
                </span>
              </div>
            ) : null}

            <span className={styles.pendingFooter}>
              <span className={styles.pendingAction} data-testid="event-card-action">
                <UsersRound className={styles.pendingActionIcon} aria-hidden="true" />
                {state.actionLabel}
              </span>
            </span>
          </div>
        </div>
      </CardLink>
    );
  }

  if (isHistoryConsultation) {
    return (
      <CardLink
        href={ROUTES.event(event.id)}
        aria-label={`${state.actionLabel}: ${event.title}`}
        padding="sm"
        priorityTone="warn"
        data-testid="event-card"
        className={cn(styles.card, styles.historyConsultationCard, "group")}
        style={presenceIndicatorStyle(historyTone, metrics.hasPresenceData)}
      >
        <div className={styles.historyContent}>
          <span className={styles.historyIconWrap} aria-hidden="true">
            <UsersRound className={styles.historyIcon} />
          </span>

          <div className={styles.historyBody}>
            <div className={styles.historyHeader}>
              <p className={cn(styles.title, styles.historyTitle)}>{consultationTitle}</p>
              <Badge tone="ok" className={cn(styles.badge, styles.historyBadge)}>Registrada</Badge>
            </div>

            <p className={styles.historyMeta}>
              <CalendarDays className={styles.historyMetaIcon} aria-hidden="true" />
              {eventDateTimeLabel(event)}
            </p>

            {state.locationName ? (
              <p className={styles.historyLocation}>
                <MapPin className={styles.historyMetaIcon} aria-hidden="true" />
                <span className="min-w-0 truncate">{state.locationName}</span>
              </p>
            ) : null}

            <div className={styles.historyPresence}>
              <span className={styles.historyPresenceTop}>
                <span className={styles.historyPresenceLabel}>Presença do encontro</span>
                <strong className={styles.historyPresenceValue}>
                  {formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}
                </strong>
              </span>
              <span className={styles.historyPresenceDetail}>
                {metrics.presentCount} de {metrics.accountableCount} membros presentes
              </span>
              <span className={styles.historyProgressTrack} aria-hidden="true">
                <span className={styles.historyProgressFill} style={{ width: `${safePresenceRate}%` }} />
              </span>
            </div>

            <span className={styles.historyFooter}>
              <span className={styles.historyStat}>
                <UsersRound className={styles.historyStatIcon} aria-hidden="true" />
                <strong>{metrics.visitorCount}</strong>
                <span>{metrics.visitorCount === 1 ? "visitante" : "visitantes"}</span>
              </span>
              <span className={styles.historyStat}>
                <ClipboardCheck className={styles.historyStatIcon} aria-hidden="true" />
                <strong>{metrics.markingsCount}</strong>
                <span>{metrics.markingsCount === 1 ? "membro" : "membros"}</span>
              </span>
              <span className={styles.historyAction} data-testid="event-card-action">
                {state.actionLabel}
                <ArrowRight className={styles.historyActionIcon} aria-hidden="true" />
              </span>
            </span>
          </div>
        </div>
      </CardLink>
    );
  }

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
            <PresenceMetricDisplay
              hasPresenceData={metrics.hasPresenceData}
              presenceRate={metrics.presenceRate}
              tone={presenceTone(metrics.hasPresenceData, metrics.presenceRate)}
              value={formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}
              context="event"
              size="sm"
              className={styles.statPresenceMetric}
            />
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

export function EventList({
  events,
  user,
  now,
  limit = EVENT_LIST_LIMIT,
  variant = "default",
}: {
  events: EventListEvent[];
  user: PermissionUser;
  now: Date;
  limit?: number;
  variant?: EventCardVariant;
}) {
  return (
    <ProgressiveList initialCount={limit} step={EVENT_LIST_LIMIT} moreLabel="Ver mais encontros">
      {events.map((event) => <EventCard key={event.id} event={event} user={user} now={now} variant={variant} />)}
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
        href={eventsConsultationSectionHref("sem-presenca", "30d")}
        title="Pendências"
        description="Encontros sem presença registrada"
        icon={ClipboardCheck}
      />
      <ConsultationCard
        href={eventsConsultationSectionHref("historico", "30d")}
        title="Histórico"
        description="Encontros com presença registrada"
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
      <PageHero
        compact
        eyebrow="Consulta"
        title={view.title}
        description={view.description}
      />
      <section id={EVENTS_CONSULTATION_SECTION_ID} className="scroll-mt-6">
        <div className={styles.consultationPeriodChips}>
          <PeriodChips mode={mode} activePeriod={period} />
        </div>
        {view.filteredEvents.length > 0 ? (
          <EventList
            events={view.filteredEvents}
            user={user}
            now={now}
            variant={mode === "sem-presenca" ? "pendingConsultation" : "historyConsultation"}
          />
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
