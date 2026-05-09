import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/generated/prisma/client";
import {
  PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT,
  PRESENCE_TREND_MIN_DELTA,
  PRESENCE_TREND_PREVIOUS_SAMPLE_COUNT,
  PRESENCE_TREND_RECENT_SAMPLE_COUNT,
  PRESENCE_TREND_TOTAL_SAMPLE_COUNT,
  splitPresenceTrendSamples,
  summarizeEventPresence,
  summarizeEventsPresence,
  summarizePresenceTrend,
} from "./presence-summary";

function event(status: string, attendances: AttendanceStatus[]) {
  return { status, attendances: attendances.map((attendanceStatus) => ({ status: attendanceStatus })) };
}

describe("presence summary", () => {
  it("does not treat a completed event without member markings as zero percent presence", () => {
    const summary = summarizeEventPresence(event("COMPLETED", []));

    expect(summary.completed).toBe(true);
    expect(summary.hasPresenceData).toBe(false);
    expect(summary.presenceRate).toBe(0);
  });

  it("ignores visitors in the presence denominator", () => {
    const summary = summarizeEventPresence(event("COMPLETED", [
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.VISITOR,
    ]));

    expect(summary.hasPresenceData).toBe(true);
    expect(summary.presenceRate).toBe(50);
    expect(summary.visitorCount).toBe(1);
    expect(summary.markingsCount).toBe(3);
  });

  it("summarizes only recorded events when aggregating a recorte", () => {
    const summary = summarizeEventsPresence([
      event("SCHEDULED", []),
      event("COMPLETED", []),
      event("COMPLETED", [AttendanceStatus.PRESENT, AttendanceStatus.JUSTIFIED]),
    ]);

    expect(summary.recordedEventsCount).toBe(2);
    expect(summary.hasPresenceData).toBe(true);
    expect(summary.presenceRate).toBe(50);
  });

  it("shows trend only with enough data and meaningful movement", () => {
    const previous = summarizeEventPresence(event("COMPLETED", [
      AttendanceStatus.PRESENT,
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
      AttendanceStatus.ABSENT,
    ]));
    const current = summarizeEventPresence(event("COMPLETED", [
      AttendanceStatus.PRESENT,
      AttendanceStatus.PRESENT,
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
    ]));
    const thinSample = summarizeEventPresence(event("COMPLETED", [
      AttendanceStatus.PRESENT,
      AttendanceStatus.ABSENT,
    ]));

    expect(summarizePresenceTrend(current, previous)).toEqual({ direction: "up", delta: 25 });
    expect(summarizePresenceTrend(previous, current)).toEqual({ direction: "down", delta: 25 });
    expect(summarizePresenceTrend(current, thinSample)).toBeNull();
  });

  it("separa a janela padrão usada para tendência de presença", () => {
    expect(PRESENCE_TREND_RECENT_SAMPLE_COUNT).toBe(4);
    expect(PRESENCE_TREND_PREVIOUS_SAMPLE_COUNT).toBe(4);
    expect(PRESENCE_TREND_TOTAL_SAMPLE_COUNT).toBe(8);
    expect(PRESENCE_TREND_MIN_ACCOUNTABLE_COUNT).toBe(3);
    expect(PRESENCE_TREND_MIN_DELTA).toBe(6);

    const samples = Array.from({ length: 10 }, (_, index) => index + 1);
    const { recentItems, previousItems } = splitPresenceTrendSamples(samples);

    expect(recentItems).toEqual([1, 2, 3, 4]);
    expect(previousItems).toEqual([5, 6, 7, 8]);
  });
});
