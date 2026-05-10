"use client";

import { EventActionFeedback } from "@/components/event-action-feedback";
import { Card } from "@/components/ui/card";
import { EventCloseAction } from "@/components/event-close-action";
import { EventLocationAction } from "@/components/event-location-action";
import { EventRescheduleAction } from "@/components/event-reschedule-action";
import { useEventDetailsActionsController } from "@/hooks/use-event-details-actions-controller";
import { eventLocationActionLabel, type EventActionStatus } from "@/features/events/event-actions-view";

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

  return (
    <Card>
      <p className="k-item-title">Ajustes do encontro</p>
      <p className="k-supporting-copy">
        Ajuste só o que mudou nesta semana. Estas alterações valem apenas para este encontro.
      </p>

      <EventLocationAction
        value={actions.localLocationName}
        defaultLocationName={defaultLocationName}
        actionLabel={eventLocationActionLabel(hasPresenceData)}
        disabled={actions.isPending}
        onChange={actions.setLocalLocationName}
        onSave={actions.saveLocation}
      />

      {actions.canReschedule ? (
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
      ) : null}

      <EventCloseAction
        hasPresenceData={hasPresenceData}
        isClosedWithoutPresence={actions.isClosedWithoutPresence}
        isFutureEvent={isFutureEvent}
        disabled={actions.isPending}
        onClose={actions.markAsCancelled}
        onReopen={actions.reopenMeeting}
      />

      <EventActionFeedback message={actions.message} errorMessage={actions.errorMessage} />
    </Card>
  );
}
