import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { buildSupervisorPageView, type SupervisorPageDashboard, type SupervisorPageSignal } from "./supervisor-page-view";

const user = { id: "supervisor-1", role: UserRole.SUPERVISOR };

function signal(overrides: Partial<SupervisorPageSignal> = {}): SupervisorPageSignal {
  return {
    id: overrides.id ?? "signal-1",
    personId: overrides.personId ?? "person-1",
    reason: overrides.reason ?? "Ausência recente",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    assignedToId: overrides.assignedToId,
    assignedTo: overrides.assignedTo,
    person: overrides.person ?? { id: overrides.personId ?? "person-1", fullName: "Maria" },
    group: overrides.group ?? { name: "Célula Central" },
    detectedAt: overrides.detectedAt,
  };
}

function dashboard(overrides: Partial<SupervisorPageDashboard> = {}): SupervisorPageDashboard {
  return {
    attentionPeople: overrides.attentionPeople ?? [],
    groups: overrides.groups ?? [],
  };
}

describe("supervisor-page-view", () => {
  it("separa urgentes, pedidos de apoio e atenção local", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        attentionPeople: [
          signal({ id: "urgent", personId: "p1", severity: SignalSeverity.URGENT }),
          signal({ id: "support", personId: "p2", assignedToId: user.id }),
          signal({ id: "attention", personId: "p3" }),
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBe("risk");
    expect(view.urgentSignals.map((item) => item.id)).toEqual(["urgent"]);
    expect(view.supportSignals.map((item) => item.id)).toEqual(["support"]);
    expect(view.attentionSignals.map((item) => item.id)).toEqual(["attention"]);
  });

  it("monta pessoas em cuidado a partir dos grupos supervisionados", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          {
            name: "Célula Central",
            memberships: [
              { person: { id: "p1", fullName: "Ana", status: PersonStatus.COOLING_AWAY } },
              { person: { id: "p2", fullName: "Bruno", status: PersonStatus.ACTIVE } },
            ],
          },
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBe("care");
    expect(view.inCarePeople).toEqual([{ id: "p1", fullName: "Ana", status: PersonStatus.COOLING_AWAY, groupName: "Célula Central" }]);
  });
});
