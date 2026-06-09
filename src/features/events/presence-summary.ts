import { AttendanceStatus } from "@/generated/prisma/client";
import { isPresentAttendanceStatus, isVisitorAttendanceStatus } from "@/features/events/attendance-display";
import { percent } from "@/lib/format";
import { hasPresenceRecording, type PresenceRecordingCandidate } from "@/features/events/presence-recording";

export type PresenceAttendance = {
  status: AttendanceStatus;
};

export type PresenceEvent = PresenceRecordingCandidate & {
  attendances: PresenceAttendance[];
};

export type PresenceSummary = {
  presenceRate: number;
  presentCount: number;
  accountableCount: number;
  visitorCount: number;
  markingsCount: number;
  hasPresenceData: boolean;
};

export type EventPresenceSummary = PresenceSummary & {
  completed: boolean;
};

export type EventsPresenceSummary = PresenceSummary & {
  recordedEventsCount: number;
};

export type PresenceTrend = {
  direction: "up" | "down";
  delta: number;
};

export const PRESENCE_TREND_RECENT_SAMPLE_COUNT = 4;
export const PRESENCE_TREND_PREVIOUS_SAMPLE_COUNT = 4;
export const PRESENCE_TREND_TOTAL_SAMPLE_COUNT = PRESENCE_TREND_RECENT_SAMPLE_COUNT + PRESENCE_TREND_PREVIOUS_SAMPLE_COUNT;

export const PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT = 3;
export const PRESENCE_TREND_MIN_DELTA = 6;

export function isPresenceRecordedEvent(event: PresenceEvent) {
  return hasPresenceRecording(event);
}

export function summarizePresenceFromAttendances(attendances: PresenceAttendance[]): PresenceSummary {
  const accountable = attendances.filter((attendance) => !isVisitorAttendanceStatus(attendance.status));
  const presentCount = accountable.filter((attendance) => isPresentAttendanceStatus(attendance.status)).length;
  const visitorCount = attendances.filter((attendance) => isVisitorAttendanceStatus(attendance.status)).length;
  const accountableCount = accountable.length;

  return {
    presenceRate: percent(presentCount, accountableCount),
    presentCount,
    accountableCount,
    visitorCount,
    markingsCount: attendances.length,
    hasPresenceData: accountableCount > 0,
  };
}

export function summarizeEventPresence(event: PresenceEvent): EventPresenceSummary {
  const completed = isPresenceRecordedEvent(event);
  const summary = summarizePresenceFromAttendances(event.attendances);

  return {
    ...summary,
    completed,
    hasPresenceData: completed && summary.hasPresenceData,
  };
}

export function summarizeEventsPresence(events: PresenceEvent[]): EventsPresenceSummary {
  const recordedEvents = events.filter(isPresenceRecordedEvent);
  const summary = summarizePresenceFromAttendances(recordedEvents.flatMap((event) => event.attendances));

  return {
    ...summary,
    recordedEventsCount: recordedEvents.length,
  };
}

export function splitPresenceTrendSamples<T>(items: T[]) {
  return {
    recentItems: items.slice(0, PRESENCE_TREND_RECENT_SAMPLE_COUNT),
    previousItems: items.slice(
      PRESENCE_TREND_RECENT_SAMPLE_COUNT,
      PRESENCE_TREND_TOTAL_SAMPLE_COUNT,
    ),
  };
}

export function summarizePresenceTrend(current: PresenceSummary, previous: PresenceSummary): PresenceTrend | null {
  if (current.accountableCount < PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT || previous.accountableCount < PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT) {
    return null;
  }

  const delta = current.presenceRate - previous.presenceRate;
  if (Math.abs(delta) < PRESENCE_TREND_MIN_DELTA) return null;

  return {
    direction: delta > 0 ? "up" : "down",
    delta: Math.abs(delta),
  };
}
