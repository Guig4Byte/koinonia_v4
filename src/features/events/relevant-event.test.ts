import { describe, expect, it } from "vitest";
import { selectRelevantCheckInEvent } from "./relevant-event";

function event(id: string, isoDate: string, status = "SCHEDULED", attendances: unknown[] = []) {
  return { id, startsAt: new Date(isoDate), status, attendances };
}

const reference = new Date("2026-04-28T12:00:00-03:00");

describe("selectRelevantCheckInEvent", () => {
  it("prefers a pending event from today", () => {
    const selected = selectRelevantCheckInEvent([
      event("past", "2026-04-21T20:00:00-03:00", "COMPLETED", [{}]),
      event("today", "2026-04-28T20:00:00-03:00", "CHECKIN_OPEN"),
      event("future", "2026-05-05T20:00:00-03:00", "SCHEDULED"),
    ], reference);

    expect(selected?.id).toBe("today");
  });

  it("falls back to the next pending event", () => {
    const selected = selectRelevantCheckInEvent([
      event("past", "2026-04-21T20:00:00-03:00", "COMPLETED", [{}]),
      event("future", "2026-05-05T20:00:00-03:00", "SCHEDULED"),
    ], reference);

    expect(selected?.id).toBe("future");
  });

  it("uses the latest completed event when there is no pending event", () => {
    const selected = selectRelevantCheckInEvent([
      event("older", "2026-04-14T20:00:00-03:00", "COMPLETED", [{}]),
      event("latest", "2026-04-21T20:00:00-03:00", "COMPLETED", [{}]),
    ], reference);

    expect(selected?.id).toBe("latest");
  });
});
