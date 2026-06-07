import { describe, expect, it } from "vitest";
import {
  canReceiveCheckInStatus,
  EVENT_STATUS,
  isCancelledEventStatus,
  isCheckInOpenEventStatus,
  isClosedWithoutPresenceStatus,
  isCompletedEventStatus,
  isNoMeetingEventStatus,
  isScheduledEventStatus,
} from "./event-status";

describe("event status rules", () => {
  it("identifies closed statuses that should not receive presence", () => {
    expect(isClosedWithoutPresenceStatus(EVENT_STATUS.CANCELLED)).toBe(true);
    expect(isClosedWithoutPresenceStatus(EVENT_STATUS.NO_MEETING)).toBe(true);
    expect(isClosedWithoutPresenceStatus(EVENT_STATUS.SCHEDULED)).toBe(false);
    expect(isClosedWithoutPresenceStatus(EVENT_STATUS.CHECKIN_OPEN)).toBe(false);
    expect(isClosedWithoutPresenceStatus(EVENT_STATUS.COMPLETED)).toBe(false);
  });

  it("keeps individual status predicates centralized", () => {
    expect(isScheduledEventStatus(EVENT_STATUS.SCHEDULED)).toBe(true);
    expect(isCheckInOpenEventStatus(EVENT_STATUS.CHECKIN_OPEN)).toBe(true);
    expect(isCompletedEventStatus(EVENT_STATUS.COMPLETED)).toBe(true);
    expect(isCancelledEventStatus(EVENT_STATUS.CANCELLED)).toBe(true);
    expect(isNoMeetingEventStatus(EVENT_STATUS.NO_MEETING)).toBe(true);
  });

  it("allows check-in only for statuses that are not closed without presence", () => {
    expect(canReceiveCheckInStatus(EVENT_STATUS.SCHEDULED)).toBe(true);
    expect(canReceiveCheckInStatus(EVENT_STATUS.CHECKIN_OPEN)).toBe(true);
    expect(canReceiveCheckInStatus(EVENT_STATUS.COMPLETED)).toBe(true);
    expect(canReceiveCheckInStatus(EVENT_STATUS.CANCELLED)).toBe(false);
    expect(canReceiveCheckInStatus(EVENT_STATUS.NO_MEETING)).toBe(false);
  });
});
