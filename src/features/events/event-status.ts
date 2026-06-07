import { EventStatus } from "@/generated/prisma/client";

export type EventStatusLike = EventStatus | string | null | undefined;

export function isScheduledEventStatus(status: EventStatusLike) {
  return status === EventStatus.SCHEDULED;
}

export function isCheckInOpenEventStatus(status: EventStatusLike) {
  return status === EventStatus.CHECKIN_OPEN;
}

export function isCompletedEventStatus(status: EventStatusLike) {
  return status === EventStatus.COMPLETED;
}

export function isCancelledEventStatus(status: EventStatusLike) {
  return status === EventStatus.CANCELLED;
}

export function isNoMeetingEventStatus(status: EventStatusLike) {
  return status === EventStatus.NO_MEETING;
}

export function isClosedWithoutPresenceStatus(status: EventStatusLike) {
  return isCancelledEventStatus(status) || isNoMeetingEventStatus(status);
}

export function canReceiveCheckInStatus(status: EventStatusLike) {
  return !isClosedWithoutPresenceStatus(status);
}
