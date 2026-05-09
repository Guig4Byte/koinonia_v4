import { describe, expect, it } from "vitest";
import { parseBrasiliaDateTime } from "./brasilia-date-time";

describe("brasilia-date-time", () => {
  it("parses date and HH:mm time in Brasília time", () => {
    expect(parseBrasiliaDateTime("08/05/2026", "09:30")).toBe("2026-05-08T12:30:00.000Z");
  });

  it("rejects invalid or incomplete local time values", () => {
    expect(parseBrasiliaDateTime("08/05/2026", "9:30")).toBeNull();
    expect(parseBrasiliaDateTime("08/05/2026", "24:00")).toBeNull();
    expect(parseBrasiliaDateTime("08/05/2026", "20h00")).toBeNull();
  });
});
