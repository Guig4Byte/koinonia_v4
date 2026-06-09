import { isCancelledEventStatus, isNoMeetingEventStatus } from "@/features/events/event-status";

export { isClosedWithoutPresenceStatus } from "@/features/events/event-status";

export function eventEffectiveLocation(event: {
  locationName?: string | null;
  group?: { locationName?: string | null } | null;
}) {
  return event.locationName ?? event.group?.locationName ?? null;
}

export function closedWithoutPresenceLabel(status: string, fallback = "Sobre o encontro") {
  if (isCancelledEventStatus(status)) return "Cancelado";
  if (isNoMeetingEventStatus(status)) return "Não houve encontro";
  return fallback;
}
