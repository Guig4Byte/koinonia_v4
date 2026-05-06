import { addBrasiliaDays, isSameBrasiliaDay, startOfBrasiliaDay } from "../../lib/brasilia-time";

export type RelevantEventCandidate = {
  startsAt: Date;
  status: string;
  attendances?: unknown[];
};

function nextBrasiliaDay(date: Date) {
  return addBrasiliaDays(startOfBrasiliaDay(date), 1);
}

export function hasRecordedPresence(event: RelevantEventCandidate) {
  return event.status === "COMPLETED" || (event.attendances?.length ?? 0) > 0;
}

function isCancelledEvent(event: RelevantEventCandidate) {
  return event.status === "CANCELLED" || event.status === "NO_MEETING";
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
