import { describe, expect, it } from "vitest";
import {
  matchesSupervisorGroupFilter,
  matchesTeamGroupFilter,
} from "./group-filtering";
import type { GroupPastoralPriorityInput } from "./group-pastoral-priority";

function group(
  overrides: Partial<GroupPastoralPriorityInput> = {},
): GroupPastoralPriorityInput {
  return {
    hasPresenceData: true,
    presenceRate: 90,
    attentionCount: 0,
    urgentCount: 0,
    pastoralCasesCount: 0,
    supportRequestsCount: 0,
    localAttentionCount: 0,
    inCareCount: 0,
    ...overrides,
  };
}

describe("group-filtering", () => {
  it("mantém cuidado e presença separados na visão de supervisão", () => {
    expect(
      matchesSupervisorGroupFilter(group({ inCareCount: 1 }), "atencao"),
    ).toBe(false);
    expect(
      matchesSupervisorGroupFilter(group({ inCareCount: 1 }), "em-cuidado"),
    ).toBe(true);
    expect(
      matchesSupervisorGroupFilter(group({ presenceRate: 60 }), "atencao"),
    ).toBe(false);
    expect(
      matchesSupervisorGroupFilter(group({ presenceRate: 60 }), "presenca"),
    ).toBe(true);
  });

  it("usa a classificação pastoral principal na visão de equipe", () => {
    expect(matchesTeamGroupFilter(group({ inCareCount: 1 }), "atencao")).toBe(
      true,
    );
    expect(matchesTeamGroupFilter(group({ presenceRate: 60 }), "atencao")).toBe(
      true,
    );
    expect(
      matchesTeamGroupFilter(group({ hasPresenceData: false }), "sem-presenca"),
    ).toBe(true);
    expect(matchesTeamGroupFilter(group(), "estaveis")).toBe(true);
  });
});
