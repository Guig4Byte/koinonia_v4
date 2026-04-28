export type RelevantEventCandidate = {
  startsAt: Date;
  status: string;
  attendances?: unknown[];
};

function startOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function nextLocalDay(date: Date) {
  const copy = startOfLocalDay(date);
  copy.setDate(copy.getDate() + 1);
  return copy;
}

function isSameLocalDay(left: Date, right: Date) {
  return startOfLocalDay(left).getTime() === startOfLocalDay(right).getTime();
}

export function hasRecordedPresence(event: RelevantEventCandidate) {
  return event.status === "COMPLETED" || (event.attendances?.length ?? 0) > 0;
}

export function selectRelevantCheckInEvent<T extends RelevantEventCandidate>(events: T[], referenceDate = new Date()) {
  if (events.length === 0) return null;

  const ascending = [...events].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime());
  const descending = [...events].sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());
  const today = startOfLocalDay(referenceDate);

  const pendingToday = ascending.find((event) => isSameLocalDay(event.startsAt, referenceDate) && !hasRecordedPresence(event));
  if (pendingToday) return pendingToday;

  const nextPending = ascending.find((event) => event.startsAt >= today && !hasRecordedPresence(event));
  if (nextPending) return nextPending;

  const latestDone = descending.find((event) => hasRecordedPresence(event) && event.startsAt < nextLocalDay(referenceDate));
  if (latestDone) return latestDone;

  return descending[0];
}
