import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { signalBadgeForViewer, signalDetailForViewer, signalReasonForViewer } from "./display";

describe("signal display helpers", () => {
  it("keeps urgent as urgent for every viewer even when support was requested", () => {
    const signal = { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(signalBadgeForViewer(signal, { role: UserRole.LEADER })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer(signal, { role: UserRole.SUPERVISOR })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer(signal, { role: UserRole.PASTOR })).toEqual({ label: "Urgente", tone: "risk" });
  });

  it("shows supervisor support as a request for supervisors and as requested support for leaders", () => {
    const signal = { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } };

    expect(signalBadgeForViewer(signal, { role: UserRole.SUPERVISOR })).toEqual({ label: "Pedido de apoio", tone: "support" });
    expect(signalBadgeForViewer(signal, { role: UserRole.LEADER })).toEqual({ label: "Apoio solicitado", tone: "support" });
  });

  it("keeps urgent unassigned signals consistent", () => {
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.LEADER })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.SUPERVISOR })).toEqual({ label: "Urgente", tone: "risk" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.URGENT }, { role: UserRole.PASTOR })).toEqual({ label: "Urgente", tone: "risk" });
  });


  it("shows informational signals as informative for pastoral viewers", () => {
    expect(signalBadgeForViewer({ severity: SignalSeverity.INFO }, { role: UserRole.PASTOR })).toEqual({ label: "Informativo", tone: "info" });
    expect(signalBadgeForViewer({ severity: SignalSeverity.INFO }, { role: UserRole.ADMIN })).toEqual({ label: "Informativo", tone: "info" });
  });

  it("normalizes supervisor support reason for leader viewers", () => {
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.LEADER })).toBe("Apoio solicitado à supervisão");
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.SUPERVISOR })).toBe("Líder pediu apoio da supervisão");
  });


  it("uses contextual escalation detail before raw reason", () => {
    const supportSignal = {
      reason: "Líder pediu apoio da supervisão",
      severity: SignalSeverity.ATTENTION,
      assignedTo: { role: UserRole.SUPERVISOR },
    };
    const pastoralSignal = {
      reason: "Faltas consecutivas",
      severity: SignalSeverity.ATTENTION,
      assignedTo: { role: UserRole.PASTOR },
    };

    expect(signalDetailForViewer(supportSignal, { role: UserRole.SUPERVISOR })).toBe("Essa célula pediu apoio da supervisão.");
    expect(signalDetailForViewer(supportSignal, { role: UserRole.LEADER })).toBe("Apoio solicitado à supervisão.");
    expect(signalDetailForViewer(pastoralSignal, { role: UserRole.PASTOR })).toBe("Encaminhado ao cuidado pastoral.");
    expect(signalDetailForViewer(pastoralSignal, { role: UserRole.LEADER })).toBe("Encaminhado ao pastor.");
  });
});
