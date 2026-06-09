import { describe, expect, it } from "vitest";
import { EventStatus } from "@/generated/prisma/client";
import { hasPresenceRecording } from "./presence-recording";

describe("presence recording", () => {
  it("treats a completed event as recorded even without attendance markings", () => {
    expect(hasPresenceRecording({ status: EventStatus.COMPLETED, attendances: [] })).toBe(true);
  });

  it("treats an event with any attendance marking as recorded", () => {
    expect(hasPresenceRecording({ status: EventStatus.SCHEDULED, attendances: [{}] })).toBe(true);
  });

  it("does not treat pending or closed-without-meeting events without markings as recorded", () => {
    expect(hasPresenceRecording({ status: EventStatus.SCHEDULED, attendances: [] })).toBe(false);
    expect(hasPresenceRecording({ status: EventStatus.CANCELLED })).toBe(false);
    expect(hasPresenceRecording({ status: EventStatus.NO_MEETING, attendances: null })).toBe(false);
  });
});
