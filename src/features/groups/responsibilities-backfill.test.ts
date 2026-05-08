import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole } from "@/generated/prisma/client";
import {
  buildLegacyResponsibilityBackfillCandidates,
  legacyResponsibilityCandidatesForGroup,
} from "./responsibilities-backfill";

const baseGroup = {
  id: "group-1",
  churchId: "church-1",
  leaderUserId: "leader-1",
  supervisorUserId: "supervisor-1",
};

describe("legacyResponsibilityCandidatesForGroup", () => {
  it("creates candidates from legacy leader and supervisor fields", () => {
    expect(legacyResponsibilityCandidatesForGroup(baseGroup)).toEqual([
      {
        churchId: "church-1",
        groupId: "group-1",
        userId: "leader-1",
        role: GroupResponsibilityRole.LEADER,
      },
      {
        churchId: "church-1",
        groupId: "group-1",
        userId: "supervisor-1",
        role: GroupResponsibilityRole.SUPERVISOR,
      },
    ]);
  });

  it("skips legacy fields that already have an active responsibility", () => {
    expect(
      legacyResponsibilityCandidatesForGroup({
        ...baseGroup,
        responsibilities: [
          { userId: "leader-1", role: GroupResponsibilityRole.LEADER, activeUntil: null },
        ],
      }),
    ).toEqual([
      {
        churchId: "church-1",
        groupId: "group-1",
        userId: "supervisor-1",
        role: GroupResponsibilityRole.SUPERVISOR,
      },
    ]);
  });

  it("creates a new candidate when the previous responsibility is inactive", () => {
    expect(
      legacyResponsibilityCandidatesForGroup({
        ...baseGroup,
        supervisorUserId: null,
        responsibilities: [
          { userId: "leader-1", role: GroupResponsibilityRole.LEADER, activeUntil: new Date("2026-01-01") },
        ],
      }),
    ).toEqual([
      {
        churchId: "church-1",
        groupId: "group-1",
        userId: "leader-1",
        role: GroupResponsibilityRole.LEADER,
      },
    ]);
  });
});

describe("buildLegacyResponsibilityBackfillCandidates", () => {
  it("deduplicates candidates by group, user and role", () => {
    expect(
      buildLegacyResponsibilityBackfillCandidates([
        baseGroup,
        { ...baseGroup },
      ]),
    ).toHaveLength(2);
  });
});
