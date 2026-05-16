import { ProgressiveList } from "@/components/shared/progressive-list";
import { EVENT_LIST_LIMIT, type EventListEvent } from "@/features/events/events-page-view";
import type { PermissionUser } from "@/features/permissions/permissions";
import { EventCard, type EventCardVariant } from "./event-card";

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
