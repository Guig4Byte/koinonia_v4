import { describe, expect, it } from "vitest";
import { EventStatus, EventType } from "@/generated/prisma/client";
import {
  existingCellMeetingStartsByGroup,
  parseMeetingTime,
  scheduledCellMeetingCreateData,
  scheduledCellMeetingPlans,
  scheduledCellMeetingStarts,
  type ScheduledCellMeetingPlan,
} from "./schedule";

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
    expect(
      scheduledCellMeetingStarts({ meetingDayOfWeek: null, meetingTime: "20:00", from: new Date(), until: new Date() }),
    ).toEqual([]);
    expect(
      scheduledCellMeetingStarts({ meetingDayOfWeek: 2, meetingTime: null, from: new Date(), until: new Date() }),
    ).toEqual([]);
  });
});

describe("scheduledCellMeetingPlans", () => {
  it("keeps only groups that have meetings in the generation window", () => {
    const plans = scheduledCellMeetingPlans(
      [
        cellGroup({ id: "group-1", meetingDayOfWeek: 4, meetingTime: "19:30" }),
        cellGroup({ id: "group-invalid-time", meetingDayOfWeek: 4, meetingTime: "25:00" }),
      ],
      {
        from: new Date("2026-05-04T00:00:00-03:00"),
        until: new Date("2026-05-11T23:59:59-03:00"),
      },
    );

    expect(plans).toHaveLength(1);
    expect(plans[0]?.group.id).toBe("group-1");
    expect(plans[0]?.starts.map((date) => date.toISOString())).toEqual([
      new Date("2026-05-07T19:30:00-03:00").toISOString(),
    ]);
  });
});

describe("existingCellMeetingStartsByGroup", () => {
  it("groups existing event start keys by group and prefers scheduleStartsAt", () => {
    const startsAt = new Date("2026-05-07T19:30:00-03:00");
    const scheduleStartsAt = new Date("2026-05-07T20:00:00-03:00");

    const startsByGroup = existingCellMeetingStartsByGroup([
      { groupId: "group-1", startsAt, scheduleStartsAt },
      { groupId: "group-2", startsAt, scheduleStartsAt: null },
      { groupId: null, startsAt, scheduleStartsAt: null },
    ]);

    expect(startsByGroup.get("group-1")?.has(scheduleStartsAt.getTime())).toBe(true);
    expect(startsByGroup.get("group-1")?.has(startsAt.getTime())).toBe(false);
    expect(startsByGroup.get("group-2")?.has(startsAt.getTime())).toBe(true);
    expect(startsByGroup.has("group-3")).toBe(false);
  });
});

describe("scheduledCellMeetingCreateData", () => {
  it("builds createMany data only for starts that do not exist yet", () => {
    const existingStart = new Date("2026-05-07T19:30:00-03:00");
    const newStart = new Date("2026-05-14T19:30:00-03:00");
    const plans: ScheduledCellMeetingPlan[] = [
      {
        group: cellGroup({ id: "group-1", name: "Célula Esperança", locationName: "Casa da Ana" }),
        starts: [existingStart, newStart],
      },
    ];

    const createData = scheduledCellMeetingCreateData(
      plans,
      new Map([["group-1", new Set([existingStart.getTime()])]]),
    );

    expect(createData).toEqual([
      {
        churchId: "church-1",
        groupId: "group-1",
        createdById: "leader-1",
        type: EventType.CELL_MEETING,
        title: "Célula Esperança",
        startsAt: newStart,
        status: EventStatus.SCHEDULED,
        locationName: "Casa da Ana",
        generatedFromSchedule: true,
        scheduleStartsAt: newStart,
      },
    ]);
  });

  it("uses null as createdById when the group has no active leader", () => {
    const startsAt = new Date("2026-05-07T19:30:00-03:00");
    const plans: ScheduledCellMeetingPlan[] = [
      {
        group: cellGroup({ id: "group-1", responsibilities: [] }),
        starts: [startsAt],
      },
    ];

    expect(scheduledCellMeetingCreateData(plans, new Map())[0]?.createdById).toBeNull();
  });
});

function cellGroup(overrides: Partial<ScheduledCellMeetingPlan["group"]> = {}): ScheduledCellMeetingPlan["group"] {
  return {
    id: "group-1",
    churchId: "church-1",
    name: "Célula Esperança",
    responsibilities: [{ userId: "leader-1" }],
    meetingDayOfWeek: 4,
    meetingTime: "19:30",
    locationName: null,
    eventsGeneratedUntil: null,
    ...overrides,
  };
}
