import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  classifySignal,
  isPastoralCaseSignal,
  isPastoralEscalationSignal,
  isSupportRequestSignal,
  isUrgentOrPastoralCaseSignal,
  signalAssignmentKind,
  signalPastoralSectionKind,
} from "./signal-classification";

describe("signal classification", () => {
  it("centraliza encaminhamentos pastorais e pedidos de apoio", () => {
    expect(signalAssignmentKind({ assignedTo: { role: UserRole.PASTOR } })).toBe("pastoral");
    expect(signalAssignmentKind({ assignedTo: { role: UserRole.ADMIN } })).toBe("pastoral");
    expect(signalAssignmentKind({ assignedTo: { role: UserRole.SUPERVISOR } })).toBe("supervisor");
    expect(signalAssignmentKind({ assignedTo: null })).toBeNull();
  });

  it("separa urgência, caso pastoral e apoio à supervisão", () => {
    const urgent = { severity: SignalSeverity.URGENT };
    const pastoralCase = { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } };
    const supportRequest = { severity: SignalSeverity.ATTENTION, assignedToId: "supervisor-1", assignedTo: { role: UserRole.SUPERVISOR } };

    expect(isPastoralEscalationSignal(urgent)).toBe(true);
    expect(isPastoralEscalationSignal(pastoralCase)).toBe(true);
    expect(isPastoralCaseSignal(urgent)).toBe(false);
    expect(isPastoralCaseSignal(pastoralCase)).toBe(true);
    expect(isUrgentOrPastoralCaseSignal(supportRequest)).toBe(false);
    expect(isSupportRequestSignal(supportRequest, { id: "supervisor-1", role: UserRole.SUPERVISOR })).toBe(true);
  });

  it("mantém a seção pastoral dependente do viewer para pedidos da supervisão", () => {
    const supportRequest = { severity: SignalSeverity.ATTENTION, assignedToId: "supervisor-1", assignedTo: { role: UserRole.SUPERVISOR } };

    expect(signalPastoralSectionKind(supportRequest, { id: "supervisor-1", role: UserRole.SUPERVISOR })).toBe("support");
    expect(signalPastoralSectionKind(supportRequest, { id: "supervisor-2", role: UserRole.SUPERVISOR })).toBe("attention");
    expect(signalPastoralSectionKind(supportRequest, { id: "pastor-1", role: UserRole.PASTOR })).toBe("support");
    expect(classifySignal(supportRequest, { id: "supervisor-1", role: UserRole.SUPERVISOR })).toMatchObject({
      assignmentKind: "supervisor",
      pastoralSectionKind: "support",
      isSupervisorSupport: true,
      isPastoralEscalation: false,
    });
  });
});
