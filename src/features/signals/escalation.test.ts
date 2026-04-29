import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { escalationStatusLabel, isPastoralEscalation } from "./escalation";

describe("signal escalation helpers", () => {
  it("treats urgent signals as pastoral even without assignment", () => {
    expect(isPastoralEscalation({ severity: SignalSeverity.URGENT })).toBe(true);
  });

  it("treats signals assigned to pastor/admin as pastoral escalation", () => {
    expect(isPastoralEscalation({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } })).toBe(true);
    expect(isPastoralEscalation({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.ADMIN } })).toBe(true);
  });

  it("does not treat support requested to supervisor as pastoral", () => {
    expect(isPastoralEscalation({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } })).toBe(false);
    expect(escalationStatusLabel({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } })).toBe("Apoio solicitado");
  });
});
