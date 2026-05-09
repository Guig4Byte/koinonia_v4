import { describe, expect, it } from "vitest";
import { parseClockTime } from "./time-validation";

describe("time-validation", () => {
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
