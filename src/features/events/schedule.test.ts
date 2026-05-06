import { describe, expect, it } from "vitest";
import { parseMeetingTime, scheduledCellMeetingStarts } from "./schedule";

describe("parseMeetingTime", () => {
  it("accepts HH:mm values", () => {
    expect(parseMeetingTime("19:30")).toEqual({ hours: 19, minutes: 30 });
    expect(parseMeetingTime("8:05")).toEqual({ hours: 8, minutes: 5 });
  });

  it("rejects invalid times", () => {
    expect(parseMeetingTime(null)).toBeNull();
    expect(parseMeetingTime("24:00")).toBeNull();
    expect(parseMeetingTime("20:99")).toBeNull();
    expect(parseMeetingTime("20h00")).toBeNull();
  });
});

describe("scheduledCellMeetingStarts", () => {
  it("generates weekly meetings from the schedule day and time", () => {
    const starts = scheduledCellMeetingStarts({
      meetingDayOfWeek: 4,
      meetingTime: "19:30",
      from: new Date("2026-05-04T00:00:00-03:00"),
      until: new Date("2026-05-25T23:59:59-03:00"),
    });

    expect(starts.map((date) => date.toISOString())).toEqual([
      new Date("2026-05-07T19:30:00-03:00").toISOString(),
      new Date("2026-05-14T19:30:00-03:00").toISOString(),
      new Date("2026-05-21T19:30:00-03:00").toISOString(),
    ]);
  });

  it("includes today's meeting when the generation starts at the beginning of the day", () => {
    const starts = scheduledCellMeetingStarts({
      meetingDayOfWeek: 2,
      meetingTime: "20:00",
      from: new Date("2026-05-05T00:00:00-03:00"),
      until: new Date("2026-05-12T23:59:59-03:00"),
    });

    expect(starts[0]?.toISOString()).toBe(new Date("2026-05-05T20:00:00-03:00").toISOString());
  });

  it("skips to the next week when the meeting time already passed", () => {
    const starts = scheduledCellMeetingStarts({
      meetingDayOfWeek: 2,
      meetingTime: "20:00",
      from: new Date("2026-05-05T21:00:00-03:00"),
      until: new Date("2026-05-19T23:59:59-03:00"),
    });

    expect(starts[0]?.toISOString()).toBe(new Date("2026-05-12T20:00:00-03:00").toISOString());
  });

  it("returns no meetings when the schedule is incomplete", () => {
    expect(scheduledCellMeetingStarts({ meetingDayOfWeek: null, meetingTime: "20:00", from: new Date(), until: new Date() })).toEqual([]);
    expect(scheduledCellMeetingStarts({ meetingDayOfWeek: 2, meetingTime: null, from: new Date(), until: new Date() })).toEqual([]);
  });
});
