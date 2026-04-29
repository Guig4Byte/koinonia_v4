import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "../../generated/prisma/client";
import { personEffectiveBadgeForViewer, personStatusDisplay } from "./status-display";

describe("person status display", () => {
  it("shows in-care people with the care tone", () => {
    expect(personStatusDisplay(PersonStatus.COOLING_AWAY)).toEqual({ label: "Em cuidado", tone: "care" });
  });

  it("keeps active people green", () => {
    expect(personStatusDisplay(PersonStatus.ACTIVE)).toEqual({ label: "Ativo", tone: "ok" });
  });
});

describe("person effective badge", () => {
  it("uses the person status when there is no visible open signal", () => {
    expect(personEffectiveBadgeForViewer({ status: PersonStatus.ACTIVE }, null, { role: UserRole.LEADER })).toEqual({
      label: "Ativo",
      tone: "ok",
    });
  });

  it("prioritizes the primary signal over the raw person status", () => {
    expect(
      personEffectiveBadgeForViewer(
        { status: PersonStatus.ACTIVE },
        { severity: SignalSeverity.URGENT },
        { role: UserRole.LEADER },
      ),
    ).toEqual({ label: "Urgente", tone: "risk" });
  });

  it("keeps viewer-specific signal wording for supervisor support", () => {
    const signal = {
      severity: SignalSeverity.ATTENTION,
      assignedTo: { role: UserRole.SUPERVISOR },
    };

    expect(personEffectiveBadgeForViewer({ status: PersonStatus.NEEDS_ATTENTION }, signal, { role: UserRole.LEADER })).toEqual({
      label: "Apoio solicitado",
      tone: "support",
    });

    expect(personEffectiveBadgeForViewer({ status: PersonStatus.NEEDS_ATTENTION }, signal, { role: UserRole.SUPERVISOR })).toEqual({
      label: "Pedido de apoio",
      tone: "support",
    });
  });

  it("keeps pastoral wording for pastor/admin when a signal is assigned pastorally", () => {
    expect(
      personEffectiveBadgeForViewer(
        { status: PersonStatus.NEEDS_ATTENTION },
        { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } },
        { role: UserRole.PASTOR },
      ),
    ).toEqual({ label: "Caso pastoral", tone: "risk" });
  });
});
