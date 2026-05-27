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
  it("prioritizes urgent open signals without exposing a status badge", () => {
    const view = buildPersonCareOverviewView({
      ...baseInput,
      openSignalsCount: 1,
      hasRiskSignal: true,
      assignedActorName: "Ana",
    });

    expect(view.priorityTone).toBe("risk");
    expect(view.signalLabel).toBe("Urgente");
    expect(view.contextLabel).toBe("Ana · Célula Norte");
    expect(view.nextStepLabel).toBe("Guardar contato pastoral");
  });

  it("describes in-care people as ongoing follow-up", () => {
    const view = buildPersonCareOverviewView({
      ...baseInput,
      isInCare: true,
    });

    expect(view.priorityTone).toBe("care");
    expect(view.signalLabel).toBe("Em cuidado");
    expect(view.contextLabel).toBe("Bruno · Célula Norte");
    expect(view.nextStepLabel).toBe("Atualizar acompanhamento");
  });

  it("keeps stable people neutral and avoids creating fake tasks", () => {
    const view = buildPersonCareOverviewView(baseInput);

    expect(view.priorityTone).toBe("muted");
    expect(view.signalLabel).toBe("Estável");
    expect(view.nextStepLabel).toBe("Guardar quando houver cuidado");
  });
});
