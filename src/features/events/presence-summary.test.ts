import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "../../generated/prisma/client";
import { summarizeEventPresence, summarizeEventsPresence } from "./presence-summary";

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
});
