import { describe, expect, it } from "vitest";
import { buildPersonCareOverviewView } from "./person-care-overview";

const baseInput = {
  openSignalsCount: 0,
  hasRiskSignal: false,
  isInCare: false,
  hasPhone: true,
  canRegisterCare: true,
  primaryGroupName: "Célula Norte",
  primaryLeadershipName: "Bruno",
};

describe("buildPersonCareOverviewView", () => {
  it("prioritizes urgent open signals", () => {
    const view = buildPersonCareOverviewView({
      ...baseInput,
      openSignalsCount: 1,
      hasRiskSignal: true,
      assignedActorName: "Ana",
    });

    expect(view.priorityTone).toBe("risk");
    expect(view.badgeLabel).toBe("Ação prioritária");
    expect(view.ownerLabel).toBe("Ana");
    expect(view.nextStepLabel).toBe("Guardar contato pastoral");
  });

  it("describes in-care people as ongoing follow-up", () => {
    const view = buildPersonCareOverviewView({
      ...baseInput,
      isInCare: true,
      latestTouch: {
        title: "Ligação registrada",
        actorName: "Bruno",
        happenedAtLabel: "20/05, 19:30",
        contextLabel: "Célula Norte",
      },
    });

    expect(view.priorityTone).toBe("care");
    expect(view.badgeLabel).toBe("Em cuidado");
    expect(view.latestTouchLabel).toBe("Ligação registrada");
    expect(view.latestTouchDetail).toContain("Bruno · 20/05, 19:30 · Célula Norte");
  });

  it("keeps stable people neutral and avoids creating fake tasks", () => {
    const view = buildPersonCareOverviewView(baseInput);

    expect(view.priorityTone).toBe("muted");
    expect(view.badgeLabel).toBe("Estável");
    expect(view.nextStepLabel).toBe("Guardar quando houver cuidado");
  });
});
