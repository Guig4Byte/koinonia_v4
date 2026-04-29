import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { canEscalateSignalToPastor, canRequestSupervisorSupport, escalationStatusDetailForViewer, escalationStatusLabel, escalationStatusLabelForViewer, isPastoralEscalation, shouldShowEscalationStatusForViewer } from "./escalation";

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

  it("does not show supervisor support messages to pastor/admin viewers", () => {
    const supervisorRequest = { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(isPastoralEscalation(supervisorRequest)).toBe(true);
    expect(shouldShowEscalationStatusForViewer(supervisorRequest, { role: UserRole.PASTOR })).toBe(false);
    expect(shouldShowEscalationStatusForViewer(supervisorRequest, { role: UserRole.ADMIN })).toBe(false);
    expect(escalationStatusLabelForViewer(supervisorRequest, { role: UserRole.PASTOR })).toBeNull();
  });

  it("keeps supervisor support messages visible to leader and supervisor viewers", () => {
    const supervisorRequest = { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(escalationStatusLabelForViewer(supervisorRequest, { role: UserRole.LEADER })).toBe("Apoio solicitado");
    expect(escalationStatusLabelForViewer(supervisorRequest, { role: UserRole.SUPERVISOR })).toBe("Pedido de apoio");
  });

  it("shows pastoral assignment messages to pastor viewers", () => {
    const pastoralRequest = { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } };

    expect(escalationStatusLabelForViewer(pastoralRequest, { role: UserRole.PASTOR })).toBe("Encaminhado ao pastor");
  });

  it("hides supervisor support details from pastor viewers", () => {
    const supervisorRequest = { severity: SignalSeverity.URGENT, assignedTo: { name: "Ana", role: UserRole.SUPERVISOR } };

    expect(escalationStatusDetailForViewer(supervisorRequest, { role: UserRole.PASTOR })).toBeNull();
    expect(escalationStatusDetailForViewer(supervisorRequest, { role: UserRole.SUPERVISOR })).toBe("Ana recebeu este pedido de apoio.");
  });

  it("uses one detail helper for pastoral assignment messages", () => {
    const pastoralRequest = { severity: SignalSeverity.ATTENTION, assignedTo: { name: "Roberto", role: UserRole.PASTOR } };

    expect(escalationStatusDetailForViewer(pastoralRequest, { role: UserRole.PASTOR })).toBe("Roberto recebeu este caso para olhar mais de perto.");
  });
});

// Architectural guardrails: action eligibility stays in the signal feature,
// not duplicated in pages or API routes.
describe("signal escalation action eligibility", () => {
  it("allows the cell leader to request supervisor support once", () => {
    expect(canRequestSupervisorSupport(
      { id: "leader-1", role: UserRole.LEADER },
      { severity: SignalSeverity.ATTENTION, group: { leaderUserId: "leader-1", supervisorUserId: "supervisor-1" } },
    )).toBe(true);

    expect(canRequestSupervisorSupport(
      { id: "leader-1", role: UserRole.LEADER },
      { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR }, group: { leaderUserId: "leader-1", supervisorUserId: "supervisor-1" } },
    )).toBe(false);
  });

  it("allows the cell supervisor to escalate to pastor once", () => {
    expect(canEscalateSignalToPastor(
      { id: "supervisor-1", role: UserRole.SUPERVISOR },
      { severity: SignalSeverity.ATTENTION, group: { supervisorUserId: "supervisor-1" } },
    )).toBe(true);

    expect(canEscalateSignalToPastor(
      { id: "supervisor-1", role: UserRole.SUPERVISOR },
      { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR }, group: { supervisorUserId: "supervisor-1" } },
    )).toBe(false);
  });
});
