import { describe, expect, it } from "vitest";
import {
  buildGroupCardView,
  groupCardPresenceLabel,
  resolveGroupCardPriorityTone,
} from "./group-card-view";

describe("group-card-view", () => {
  it("mantém o rótulo de presença sem dados recentes", () => {
    expect(groupCardPresenceLabel({ hasPresenceData: false, presenceRate: 0 })).toBe("Sem presença recente");
    expect(groupCardPresenceLabel({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 0 })).toBe("Sem encontros registrados");
  });

  it("marca presença baixa abaixo do limite de risco", () => {
    expect(groupCardPresenceLabel({ hasPresenceData: true, presenceRate: 49 })).toBe("Presença baixa");
    expect(groupCardPresenceLabel({ hasPresenceData: true, presenceRate: 50 })).toBe("Presença recente");
  });

  it("só promove tons pastorais relevantes para prioridade visual", () => {
    expect(resolveGroupCardPriorityTone({ badgeTone: "neutral" })).toBeUndefined();
    expect(resolveGroupCardPriorityTone({ badgeTone: "ok" })).toBeUndefined();
    expect(resolveGroupCardPriorityTone({ badgeTone: "info" })).toBeUndefined();
    expect(resolveGroupCardPriorityTone({ badgeTone: "warn" })).toBe("warn");
    expect(resolveGroupCardPriorityTone({ badgeTone: "risk" })).toBe("risk");
    expect(resolveGroupCardPriorityTone({ badgeTone: "support" })).toBe("support");
  });

  it("preserva cardTone explícito acima do badgeTone", () => {
    expect(resolveGroupCardPriorityTone({ badgeTone: "risk", cardTone: "stable" })).toBe("stable");
  });

  it("monta o contrato de exibição usado pelo GroupCard", () => {
    expect(buildGroupCardView({ hasPresenceData: true, presenceRate: 68, badgeTone: "warn" })).toEqual({
      presenceTone: "warn",
      priorityTone: "warn",
      presenceText: "68%",
      presenceLabel: "Presença recente",
    });
  });
});
