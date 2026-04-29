import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "../../generated/prisma/client";
import { signalBadgeForViewer } from "./display";

describe("signal display helpers", () => {
  it("keeps urgent as urgent for pastoral viewers when support was requested to a supervisor", () => {
    const badge = signalBadgeForViewer(
      { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.SUPERVISOR } },
      { role: UserRole.PASTOR },
    );

    expect(badge).toEqual({ label: "Urgente", tone: "risk" });
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
});
