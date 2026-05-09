import { describe, expect, it } from "vitest";
import { CLOCK_TIME_FORMAT_HINT, CLOCK_TIME_INPUT_MAX_LENGTH, CLOCK_TIME_PATTERN, parseClockTime } from "./time-validation";

describe("time-validation", () => {
  it("exposes clock input constants", () => {
    expect(CLOCK_TIME_INPUT_MAX_LENGTH).toBe(5);
    expect(CLOCK_TIME_PATTERN).toBe("([01][0-9]|2[0-3]):[0-5][0-9]");
    expect(CLOCK_TIME_FORMAT_HINT).toContain("hh:mm");
  });

  it("parses HH:mm values", () => {
    expect(parseClockTime("09:05")).toEqual({ hours: 9, minutes: 5 });
    expect(parseClockTime("23:59")).toEqual({ hours: 23, minutes: 59 });
  });

  it("can allow a single digit hour when a schedule field accepts it", () => {
    expect(parseClockTime("8:05", { allowSingleDigitHour: true })).toEqual({ hours: 8, minutes: 5 });
    expect(parseClockTime("8:05")).toBeNull();
  });

  it("rejects invalid clock times", () => {
    expect(parseClockTime("24:00")).toBeNull();
    expect(parseClockTime("20:60")).toBeNull();
    expect(parseClockTime("20h00")).toBeNull();
  });
});
