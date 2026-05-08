import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole } from "@/generated/prisma/client";
import {
  hasAnyGroupResponsibilityScope,
  hasGroupResponsibilityScope,
  isActiveGroupResponsibility,
} from "./responsibility-scope";

const leader = { id: "leader-1" };
const supervisor = { id: "supervisor-1" };

describe("group responsibility scope", () => {
  it("uses only active responsibilities for current scope", () => {
    const group = {
      responsibilities: [
        { userId: leader.id, role: GroupResponsibilityRole.LEADER, activeUntil: null },
        { userId: supervisor.id, role: GroupResponsibilityRole.SUPERVISOR, activeUntil: new Date() },
      ],
    };

    expect(isActiveGroupResponsibility(group.responsibilities[0])).toBe(true);
    expect(hasGroupResponsibilityScope(group, leader, GroupResponsibilityRole.LEADER)).toBe(true);
    expect(hasGroupResponsibilityScope(group, supervisor, GroupResponsibilityRole.SUPERVISOR)).toBe(false);
  });

  it("keeps legacy leader and supervisor fields as fallback scope", () => {
    const group = { leaderUserId: leader.id, supervisorUserId: supervisor.id, responsibilities: [] };

    expect(hasGroupResponsibilityScope(group, leader, GroupResponsibilityRole.LEADER)).toBe(true);
    expect(hasGroupResponsibilityScope(group, supervisor, GroupResponsibilityRole.SUPERVISOR)).toBe(true);
    expect(hasAnyGroupResponsibilityScope(group, GroupResponsibilityRole.SUPERVISOR)).toBe(true);
  });
});
