import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { signalBadgeForViewer, signalReasonForViewer } from "./display";

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

  it("normalizes supervisor support reason for leader viewers", () => {
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.LEADER })).toBe("Apoio solicitado à supervisão");
    expect(signalReasonForViewer("Líder pediu apoio da supervisão", { role: UserRole.SUPERVISOR })).toBe("Líder pediu apoio da supervisão");
  });
});
