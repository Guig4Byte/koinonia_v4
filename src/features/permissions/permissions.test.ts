import { describe, expect, it } from "vitest";
import { UserRole } from "../../generated/prisma/client";
import { canCheckInEvent, canRegisterCare, canViewEvent, canViewGroup, getPrimaryVisibleGroupIdForPerson, getVisibleCareTouchWhere, getVisibleEventWhere, getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "./permissions";

const pastor = { id: "pastor-1", churchId: "church-1", role: UserRole.PASTOR };
const supervisor = { id: "supervisor-1", churchId: "church-1", role: UserRole.SUPERVISOR };
const leader = { id: "leader-1", churchId: "church-1", role: UserRole.LEADER };
const otherLeader = { id: "leader-2", churchId: "church-1", role: UserRole.LEADER };

const group = {
  id: "group-1",
  churchId: "church-1",
  isActive: true,
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

  it("does not allow direct visibility through inactive groups", () => {
    const inactiveGroup = { ...group, isActive: false };
    const inactiveEvent = { churchId: "church-1", group: inactiveGroup };
    const inactivePerson = { churchId: "church-1", memberships: [{ groupId: inactiveGroup.id, leftAt: null, group: inactiveGroup }] };

    expect(canViewGroup(pastor, inactiveGroup)).toBe(false);
    expect(canViewEvent(pastor, inactiveEvent)).toBe(false);
    expect(canViewEvent(leader, inactiveEvent)).toBe(false);
    expect(canCheckInEvent(leader, inactiveEvent)).toBe(false);
    expect(canRegisterCare(supervisor, inactivePerson)).toBe(false);
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

  it("builds visible membership filters for search result context", () => {
    expect(getVisibleMembershipWhere(leader)).toEqual({
      leftAt: null,
      group: { is: { churchId: leader.churchId, isActive: true, leaderUserId: leader.id } },
    });

    expect(getVisibleMembershipWhere(supervisor)).toEqual({
      leftAt: null,
      group: { is: { churchId: supervisor.churchId, isActive: true, supervisorUserId: supervisor.id } },
    });
  });

  it("keeps query helpers scoped to active groups in the same church", () => {
    expect(getVisibleEventWhere(pastor)).toEqual({
      churchId: pastor.churchId,
      group: { is: { churchId: pastor.churchId, isActive: true } },
    });

    expect(getVisibleEventWhere(leader)).toEqual({
      churchId: leader.churchId,
      group: { is: { churchId: leader.churchId, isActive: true, leaderUserId: leader.id } },
    });

    expect(getVisiblePersonWhere(leader)).toEqual({
      churchId: leader.churchId,
      memberships: { some: { leftAt: null, group: { is: { churchId: leader.churchId, isActive: true, leaderUserId: leader.id } } } },
    });

    expect(getVisibleOpenSignalWhere(supervisor)).toEqual({
      churchId: supervisor.churchId,
      status: "OPEN",
      group: { is: { churchId: supervisor.churchId, isActive: true, supervisorUserId: supervisor.id } },
    });
  });

  it("builds scoped care touch filters for person detail history", () => {
    expect(getVisibleCareTouchWhere(leader, "person-1")).toEqual({
      churchId: leader.churchId,
      personId: "person-1",
      group: { is: { churchId: leader.churchId, isActive: true, leaderUserId: leader.id } },
    });

    expect(getVisibleCareTouchWhere(pastor, "person-1")).toEqual({
      churchId: pastor.churchId,
      personId: "person-1",
    });
  });

});
