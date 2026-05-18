import { describe, expect, it } from "vitest";
import { buildPastoralHealthOverview, classifyPastoralHealthGroup, type PastoralHealthGroup } from "./pastoral-health";

function group(overrides: Partial<PastoralHealthGroup> = {}): PastoralHealthGroup {
  return {
    hasPresenceData: true,
    presenceRate: 90,
    ...overrides,
  };
}

describe("pastoral-health", () => {
  it("classifica pelo estado pastoral principal sem misturar urgente e encaminhado", () => {
    expect(classifyPastoralHealthGroup(group({ urgentCount: 1, pastoralCasesCount: 1, supportRequestsCount: 1 }))).toBe("urgent");
    expect(classifyPastoralHealthGroup(group({ pastoralCasesCount: 1, supportRequestsCount: 1 }))).toBe("pastoral");
    expect(classifyPastoralHealthGroup(group({ supportRequestsCount: 1, attentionCount: 1 }))).toBe("support");
    expect(classifyPastoralHealthGroup(group({ attentionCount: 1 }))).toBe("attention");
    expect(classifyPastoralHealthGroup(group({ presenceRate: 60 }))).toBe("attention");
    expect(classifyPastoralHealthGroup(group({ hasPresenceData: false, presenceRate: 0 }))).toBe("noPresence");
    expect(classifyPastoralHealthGroup(group())).toBe("stable");
  });

  it("monta segmentos sem transformar ausencia de presenca em risco", () => {
    const overview = buildPastoralHealthOverview([
      group(),
      group({ hasPresenceData: false, presenceRate: 0 }),
      group({ supportRequestsCount: 1 }),
      group({ pastoralCasesCount: 1 }),
      group({ urgentCount: 1 }),
    ]);

    expect(overview.segments.map((segment) => [segment.key, segment.count, segment.tone])).toEqual([
      ["stable", 1, "ok"],
      ["attention", 0, "warn"],
      ["noPresence", 1, "neutral"],
      ["support", 1, "support"],
      ["pastoral", 1, "risk"],
      ["urgent", 1, "risk"],
    ]);
  });
});
