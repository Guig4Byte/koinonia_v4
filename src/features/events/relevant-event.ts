import { EventStatus } from "@/generated/prisma/client";
import { hasPresenceRecording, type PresenceRecordingCandidate } from "@/features/events/presence-recording";
import { addBrasiliaDays, isSameBrasiliaDay, startOfBrasiliaDay } from "@/lib/brasilia-time";

export type RelevantEventCandidate = PresenceRecordingCandidate & {
  startsAt: Date;
};

function nextBrasiliaDay(date: Date) {
  return addBrasiliaDays(startOfBrasiliaDay(date), 1);
}

export function hasRecordedPresence(event: RelevantEventCandidate) {
  return hasPresenceRecording(event);
}

function isCancelledEvent(event: RelevantEventCandidate) {
  return event.status === EventStatus.CANCELLED || event.status === EventStatus.NO_MEETING;
}

export function selectRelevantCheckInEvent<T extends RelevantEventCandidate>(events: T[], referenceDate = new Date()) {
  if (events.length === 0) return null;

  const ascending = [...events].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const descending = [...events].sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());

  const pendingToday = ascending.find(
    (event) =>
      isSameBrasiliaDay(event.startsAt, referenceDate) &&
      event.startsAt <= referenceDate &&
      !isCancelledEvent(event) &&
      !hasRecordedPresence(event),
  );
  if (pendingToday) return pendingToday;

  const latestDone = descending.find((event) => hasRecordedPresence(event) && event.startsAt < nextBrasiliaDay(referenceDate));
  if (latestDone) return latestDone;

  return null;
}
