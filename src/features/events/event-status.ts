export const EVENT_STATUS = {
  SCHEDULED: "SCHEDULED",
  CHECKIN_OPEN: "CHECKIN_OPEN",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_MEETING: "NO_MEETING",
} as const;

export type EventStatusValue = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
export type EventStatusLike = EventStatusValue | string | null | undefined;

export function isScheduledEventStatus(status: EventStatusLike) {
  return status === EVENT_STATUS.SCHEDULED;
}

export function isCheckInOpenEventStatus(status: EventStatusLike) {
  return status === EVENT_STATUS.CHECKIN_OPEN;
}

export function isCompletedEventStatus(status: EventStatusLike) {
  return status === EVENT_STATUS.COMPLETED;
}

export function isCancelledEventStatus(status: EventStatusLike) {
  return status === EVENT_STATUS.CANCELLED;
}

export function isNoMeetingEventStatus(status: EventStatusLike) {
  return status === EVENT_STATUS.NO_MEETING;
}

export function isClosedWithoutPresenceStatus(status: EventStatusLike) {
  return isCancelledEventStatus(status) || isNoMeetingEventStatus(status);
}

export function canReceiveCheckInStatus(status: EventStatusLike) {
  return !isClosedWithoutPresenceStatus(status);
}
