"use client";

import { MapPin } from "lucide-react";
import { EventActionFeedback } from "@/features/events/components/event-action-feedback";
import { Card } from "@/components/ui/card";
import { EventCloseAction } from "@/features/events/components/event-close-action";
import { EventLocationAction } from "@/features/events/components/event-location-action";
import { EventRescheduleAction } from "@/features/events/components/event-reschedule-action";
import { useEventDetailsActionsController } from "@/features/events/hooks/use-event-details-actions-controller";
import { eventLocationActionLabel, type EventActionStatus } from "@/features/events/event-actions-view";
import styles from "./event-details-actions.module.css";

export function EventDetailsActions({
  eventId,
  status,
  startsAt,
  locationName,
  defaultLocationName,
  hasPresenceData,
  isFutureEvent,
}: {
  eventId: string;
  status: EventActionStatus;
  startsAt: string;
  locationName?: string | null;
  defaultLocationName?: string | null;
  hasPresenceData: boolean;
  isFutureEvent: boolean;
}) {
  const actions = useEventDetailsActionsController({
    eventId,
    status,
    startsAt,
    locationName,
    defaultLocationName,
    hasPresenceData,
    isFutureEvent,
  });

  const locationHint = hasPresenceData
    ? "A presença já foi registrada. Mas, se o encontro aconteceu em outro lugar, é possível alterá-lo."
    : "O local pode ser ajustado apenas para esta semana. Isso vale só para este encontro.";

  return (
    <Card className={styles.actionsCard}>
      <div className={styles.actionsHeader}>
        <span className={styles.actionsIcon} aria-hidden="true">
          <MapPin className={styles.actionsIconSvg} />
        </span>
        <p className={styles.title}>Ajustes do encontro</p>
      </div>

      <EventLocationAction
        value={actions.localLocationName}
        defaultLocationName={defaultLocationName}
        actionLabel={eventLocationActionLabel(hasPresenceData)}
        disabled={actions.isPending}
        helperText={locationHint}
        onChange={actions.setLocalLocationName}
        onSave={actions.saveLocation}
      />

      {actions.canReschedule ? (
        <div className={styles.secondaryActions}>
          <EventRescheduleAction
            localDate={actions.localDate}
            localTime={actions.localTime}
            openPicker={actions.openPicker}
            calendarMonth={actions.calendarMonth}
            selectedDateParts={actions.selectedDateParts}
            disabled={actions.isPending}
            onDateChange={actions.updateLocalDate}
            onTimeChange={actions.setLocalTime}
            onOpenPickerChange={actions.setOpenPicker}
            onCalendarMonthChange={actions.setCalendarMonth}
            onCalendarDaySelect={actions.selectCalendarDay}
            onTimeSelect={actions.selectTime}
            onReschedule={actions.rescheduleMeeting}
          />
        </div>
      ) : null}

      {!hasPresenceData ? (
        <EventCloseAction
          isClosedWithoutPresence={actions.isClosedWithoutPresence}
          isFutureEvent={isFutureEvent}
          disabled={actions.isPending}
          onClose={actions.markAsCancelled}
          onReopen={actions.reopenMeeting}
        />
      ) : null}

      <EventActionFeedback message={actions.message} errorMessage={actions.errorMessage} />
    </Card>
  );
}
