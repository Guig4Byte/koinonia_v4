import { ArrowRight, CalendarDays, ClipboardCheck, Clock3, MapPin, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { CardLink } from "@/components/ui/card-link";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { clampPresenceRate, presenceIndicatorStyle, PresenceMetricDisplay } from "@/components/shared/presence-metric";
import {
  buildEventListCardState,
  eventDateTimeLabel,
  eventMeta,
  type EventListEvent,
} from "@/features/events/events-page-view";
import type { PermissionUser } from "@/features/permissions/permissions";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import styles from "./events-page-sections.module.css";

export type EventCardVariant = "default" | "pendingConsultation" | "historyConsultation";

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
