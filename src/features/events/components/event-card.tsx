import { ArrowRight, CalendarDays, Clock3, MapPin, UsersRound } from "lucide-react";
import { ActionPill } from "@/components/ui/action-pill";
import { Badge } from "@/components/ui/badge";
import { CardHeader } from "@/components/ui/card-header";
import { CardLink } from "@/components/ui/card-link";
import { formatPresenceRate, presenceTone } from "@/features/events/presence-display";
import { PresenceMetricDisplay } from "@/components/shared/presence-metric";
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

export type EventCardVariant = "default" | "pendingConsultation";

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
  const consultationTitle = event.group?.name ?? event.title;

  if (isPendingConsultation) {
    return (
      <CardLink
        href={ROUTES.event(event.id)}
        aria-label={`${state.actionLabel}: ${event.title}`}
        padding="xs"
        radius="sm"
        containment="hidden"
        surface="event"
        priorityTone="warn"
        data-testid="event-card"
        className="group"
      >
        <div className={styles.pendingContent}>
          <span className={styles.pendingIconWrap} aria-hidden="true">
            <UsersRound className={styles.pendingIcon} />
          </span>

          <div className={styles.pendingBody}>
            <div className={styles.pendingHeader}>
              <p className={cn(styles.title, styles.pendingTitle)}>{consultationTitle}</p>
              <Badge tone={state.badgeTone} size="md" shape="rounded" maxWidth="tightHeader">Aguardando</Badge>
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
              <ActionPill
                tone="accentSoft"
                size="sm"
                minWidth="action"
                iconBefore={<UsersRound />}
                pressOnGroupActive
                data-testid="event-card-action"
              >
                {state.actionLabel}
              </ActionPill>
            </span>
          </div>
        </div>
      </CardLink>
    );
  }

  const eventAction = (
    <ActionPill
      tone="accentSoft"
      size="sm"
      iconAfter={<ArrowRight />}
      shiftIcon
      data-testid="event-card-action"
    >
      {state.actionLabel}
    </ActionPill>
  );

  return (
    <CardLink
      href={ROUTES.event(event.id)}
      aria-label={`${state.actionLabel}: ${event.title}`}
      padding={state.recordedPresence ? "sm" : "relaxedSm"}
      radius="sm"
      containment="hidden"
      surface="event"
      priorityTone={state.isPendingEvent ? "warn" : state.recordedPresence ? "stable" : state.badgeTone === "info" ? undefined : "muted"}
      data-testid="event-card"
      className="group"
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
        badgeMaxWidth="tightHeader"
        titleClassName={styles.title}
        subtitleClassName={styles.meta}
        detailClassName={styles.location}
      />

      {state.recordedPresence ? (
        <div className={styles.recordedFooter}>
          <div className={styles.stats} data-testid="event-card-stats">
            <p className={styles.stat}>
              <PresenceMetricDisplay
                hasPresenceData={metrics.hasPresenceData}
                presenceRate={metrics.presenceRate}
                tone={presenceTone(metrics.hasPresenceData, metrics.presenceRate)}
                value={formatPresenceRate(metrics.hasPresenceData, metrics.presenceRate)}
                context="event"
                size="sm"
                mode="plain"
                minHeight="none"
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
          <span className={cn(styles.footer, styles.recordedFooterAction)}>
            {eventAction}
          </span>
        </div>
      ) : null}

      {!state.recordedPresence ? <span className={styles.footer}>{eventAction}</span> : null}
    </CardLink>
  );
}
