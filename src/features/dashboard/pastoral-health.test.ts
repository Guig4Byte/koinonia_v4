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
    expect(classifyPastoralHealthGroup(group({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 1 }))).toBe("noPresence");
    expect(classifyPastoralHealthGroup(group({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 0 }))).toBe("stable");
    expect(classifyPastoralHealthGroup(group())).toBe("stable");
  });

  it("monta segmentos sem transformar ausencia de presenca em risco", () => {
    const overview = buildPastoralHealthOverview([
      group(),
      group({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 1 }),
      group({ supportRequestsCount: 1 }),
      group({ pastoralCasesCount: 1 }),
      group({ urgentCount: 1 }),
    ]);

    expect(overview.segments.map((segment) => [segment.key, segment.count, segment.tone])).toEqual([
      ["urgent", 1, "risk"],
      ["pastoral", 1, "pastoral"],
      ["support", 1, "support"],
      ["attention", 0, "warn"],
      ["noPresence", 1, "neutral"],
      ["stable", 1, "ok"],
    ]);
  });

  it("liga cada segmento ao filtro correspondente da equipe", () => {
    const overview = buildPastoralHealthOverview([group()]);

    expect(overview.segments.map((segment) => [segment.key, segment.href])).toEqual([
      ["urgent", "/equipe?filtro=urgentes"],
      ["pastoral", "/equipe?filtro=encaminhadas"],
      ["support", "/equipe?filtro=apoio"],
      ["attention", "/equipe?filtro=atencao"],
      ["noPresence", "/equipe?filtro=sem-presenca"],
      ["stable", "/equipe?filtro=estaveis"],
    ]);
  });
});
