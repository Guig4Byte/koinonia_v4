import { describe, expect, it } from "vitest";
import { UserRole } from "../../generated/prisma/client";
import { canCheckInEvent, canRegisterCare, canViewEvent, canViewGroup, getPrimaryVisibleGroupIdForPerson } from "./permissions";

const pastor = { id: "pastor-1", churchId: "church-1", role: UserRole.PASTOR };
const supervisor = { id: "supervisor-1", churchId: "church-1", role: UserRole.SUPERVISOR };
const leader = { id: "leader-1", churchId: "church-1", role: UserRole.LEADER };
const otherLeader = { id: "leader-2", churchId: "church-1", role: UserRole.LEADER };

const group = {
  id: "group-1",
  churchId: "church-1",
  leaderUserId: leader.id,
  supervisorUserId: supervisor.id,
};

const event = { churchId: "church-1", group };
const person = { churchId: "church-1", memberships: [{ groupId: group.id, leftAt: null, group }] };

describe("permission helpers", () => {
  it("allows whole-church users to view scoped pastoral data", () => {
    expect(canViewGroup(pastor, group)).toBe(true);
    expect(canViewEvent(pastor, event)).toBe(true);
    expect(canRegisterCare(pastor, person)).toBe(true);
  });

  it("allows supervisor and leader only inside their group scope", () => {
    expect(canViewGroup(supervisor, group)).toBe(true);
    expect(canViewGroup(leader, group)).toBe(true);
    expect(canViewGroup(otherLeader, group)).toBe(false);
  });

  it("keeps check-in restricted to the leader of the event group", () => {
    expect(canCheckInEvent(leader, event)).toBe(true);
    expect(canCheckInEvent(supervisor, event)).toBe(false);
    expect(canCheckInEvent(pastor, event)).toBe(false);
    expect(canCheckInEvent(otherLeader, event)).toBe(false);
  });

  it("returns the first visible active group when registering care", () => {
    expect(getPrimaryVisibleGroupIdForPerson(leader, person)).toBe(group.id);
    expect(getPrimaryVisibleGroupIdForPerson(otherLeader, person)).toBeUndefined();
  });
});
