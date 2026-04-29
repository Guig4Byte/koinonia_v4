import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson, isPastoralSignal } from "./attention";

function signal(personId: string, severity: SignalSeverity, detectedAt: string, role?: UserRole) {
  return { personId, severity, detectedAt: new Date(detectedAt), assignedTo: role ? { role } : null };
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

describe("pastoral signal helpers", () => {
  it("treats urgent signals as pastoral by default", () => {
    expect(isPastoralSignal(signal("person-1", SignalSeverity.URGENT, "2026-04-24T10:00:00.000Z"))).toBe(true);
    expect(isPastoralSignal(signal("person-1", SignalSeverity.ATTENTION, "2026-04-24T10:00:00.000Z"))).toBe(false);
    expect(isPastoralSignal(signal("person-1", SignalSeverity.INFO, "2026-04-24T10:00:00.000Z"))).toBe(false);
  });

  it("treats signals assigned to pastor/admin as pastoral even when not urgent", () => {
    expect(isPastoralSignal(signal("person-1", SignalSeverity.ATTENTION, "2026-04-24T10:00:00.000Z", UserRole.PASTOR))).toBe(true);
    expect(isPastoralSignal(signal("person-1", SignalSeverity.ATTENTION, "2026-04-24T10:00:00.000Z", UserRole.ADMIN))).toBe(true);
    expect(isPastoralSignal(signal("person-1", SignalSeverity.ATTENTION, "2026-04-24T10:00:00.000Z", UserRole.SUPERVISOR))).toBe(false);
  });

  it("keeps pastor defaults focused on severe or escalated cases, not local operational attention", () => {
    const result = getPastoralSignalsByPerson([
      signal("person-1", SignalSeverity.ATTENTION, "2026-04-25T10:00:00.000Z"),
      signal("person-2", SignalSeverity.INFO, "2026-04-26T10:00:00.000Z"),
      signal("person-3", SignalSeverity.URGENT, "2026-04-24T10:00:00.000Z"),
      signal("person-4", SignalSeverity.ATTENTION, "2026-04-23T10:00:00.000Z", UserRole.PASTOR),
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((item) => item.personId)).toEqual(["person-3", "person-4"]);
  });
});
