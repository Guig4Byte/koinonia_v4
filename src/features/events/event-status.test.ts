import { describe, expect, it } from "vitest";
import { EventStatus } from "@/generated/prisma/client";
import {
  canReceiveCheckInStatus,
  isCancelledEventStatus,
  isCheckInOpenEventStatus,
  isClosedWithoutPresenceStatus,
  isCompletedEventStatus,
  isNoMeetingEventStatus,
  isScheduledEventStatus,
} from "./event-status";

describe("event status rules", () => {
  it("identifies closed statuses that should not receive presence", () => {
    expect(isClosedWithoutPresenceStatus(EventStatus.CANCELLED)).toBe(true);
    expect(isClosedWithoutPresenceStatus(EventStatus.NO_MEETING)).toBe(true);
    expect(isClosedWithoutPresenceStatus(EventStatus.SCHEDULED)).toBe(false);
    expect(isClosedWithoutPresenceStatus(EventStatus.CHECKIN_OPEN)).toBe(false);
    expect(isClosedWithoutPresenceStatus(EventStatus.COMPLETED)).toBe(false);
  });

  it("keeps individual status predicates centralized", () => {
    expect(isScheduledEventStatus(EventStatus.SCHEDULED)).toBe(true);
    expect(isCheckInOpenEventStatus(EventStatus.CHECKIN_OPEN)).toBe(true);
    expect(isCompletedEventStatus(EventStatus.COMPLETED)).toBe(true);
    expect(isCancelledEventStatus(EventStatus.CANCELLED)).toBe(true);
    expect(isNoMeetingEventStatus(EventStatus.NO_MEETING)).toBe(true);
  });

  it("allows check-in only for statuses that are not closed without presence", () => {
    expect(canReceiveCheckInStatus(EventStatus.SCHEDULED)).toBe(true);
    expect(canReceiveCheckInStatus(EventStatus.CHECKIN_OPEN)).toBe(true);
    expect(canReceiveCheckInStatus(EventStatus.COMPLETED)).toBe(true);
    expect(canReceiveCheckInStatus(EventStatus.CANCELLED)).toBe(false);
    expect(canReceiveCheckInStatus(EventStatus.NO_MEETING)).toBe(false);
  });
});
