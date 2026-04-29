import { AttendanceStatus } from "../../generated/prisma/client";
import { percent } from "@/lib/format";

export type PresenceAttendance = {
  status: AttendanceStatus;
};

export type PresenceEvent = {
  status: string;
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

export function isPresenceRecordedEvent(event: PresenceEvent) {
  return event.status === "COMPLETED" || event.attendances.length > 0;
}

export function summarizePresenceFromAttendances(attendances: PresenceAttendance[]): PresenceSummary {
  const accountable = attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const presentCount = accountable.filter((attendance) => attendance.status === AttendanceStatus.PRESENT).length;
  const visitorCount = attendances.filter((attendance) => attendance.status === AttendanceStatus.VISITOR).length;
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
