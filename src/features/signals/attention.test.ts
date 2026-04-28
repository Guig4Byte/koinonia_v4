import { describe, expect, it } from "vitest";
import { SignalSeverity } from "../../generated/prisma/client";
import { getPrimarySignalsByPerson } from "./attention";

function signal(personId: string, severity: SignalSeverity, detectedAt: string) {
  return { personId, severity, detectedAt: new Date(detectedAt) };
}

describe("getPrimarySignalsByPerson", () => {
  it("keeps only the highest-priority open signal per person", () => {
    const result = getPrimarySignalsByPerson([
      signal("person-1", SignalSeverity.ATTENTION, "2026-04-25T10:00:00.000Z"),
      signal("person-1", SignalSeverity.URGENT, "2026-04-24T10:00:00.000Z"),
      signal("person-2", SignalSeverity.INFO, "2026-04-26T10:00:00.000Z"),
    ]);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ personId: "person-1", severity: SignalSeverity.URGENT });
    expect(result[1]).toMatchObject({ personId: "person-2", severity: SignalSeverity.INFO });
  });

  it("uses the most recent signal when severity is the same", () => {
    const result = getPrimarySignalsByPerson([
      signal("person-1", SignalSeverity.ATTENTION, "2026-04-24T10:00:00.000Z"),
      signal("person-1", SignalSeverity.ATTENTION, "2026-04-26T10:00:00.000Z"),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].detectedAt.toISOString()).toBe("2026-04-26T10:00:00.000Z");
  });
});
