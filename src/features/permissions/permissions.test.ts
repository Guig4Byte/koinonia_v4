import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import {
  canCheckInEvent,
  canManageEventDetails,
  canManageGroups,
  canRegisterCare,
  canUseLeaderDashboard,
  canUsePastorDashboard,
  canUseSupervisorDashboard,
  canViewEvent,
  canViewGroup,
  getOpenSignalInActiveGroupWhere,
  getPrimaryVisibleGroupIdForPerson,
  getVisibleCareTouchWhere,
  getVisibleEventWhere,
  getVisibleGroupIdsForPerson,
  getVisibleMembershipWhere,
  getVisibleOpenSignalWhere,
  getVisiblePersonWhere,
} from "./permissions";

const pastor = { id: "pastor-1", churchId: "church-1", role: UserRole.PASTOR };
const supervisor = { id: "supervisor-1", churchId: "church-1", role: UserRole.SUPERVISOR };
const leader = { id: "leader-1", churchId: "church-1", role: UserRole.LEADER };
const otherLeader = { id: "leader-2", churchId: "church-1", role: UserRole.LEADER };

function responsibility(userId: string, role: GroupResponsibilityRole) {
  return { userId, role, activeUntil: null };
}

function scopedGroupWhere(userId: string, role: GroupResponsibilityRole) {
  return {
    churchId: "church-1",
    isActive: true,
    OR: [
      {
        responsibilities: {
          some: {
            churchId: "church-1",
            userId,
            role,
            activeUntil: null,
          },
        },
      },
      role === GroupResponsibilityRole.LEADER ? { leaderUserId: userId } : { supervisorUserId: userId },
    ],
  };
}

const group = {
  id: "group-1",
  churchId: "church-1",
  isActive: true,
  leaderUserId: null,
  supervisorUserId: null,
  responsibilities: [
    responsibility(leader.id, GroupResponsibilityRole.LEADER),
    responsibility(supervisor.id, GroupResponsibilityRole.SUPERVISOR),
  ],
};

const event = { churchId: "church-1", startsAt: new Date(Date.now() - 60 * 1000), group };
const person = { churchId: "church-1", memberships: [{ groupId: group.id, leftAt: null, group }] };

describe("permission helpers", () => {
  it("keeps dashboard entry permissions explicit by role", () => {
    expect(canUsePastorDashboard(pastor)).toBe(true);
    expect(canUsePastorDashboard(supervisor)).toBe(false);
    expect(canUseSupervisorDashboard(supervisor)).toBe(true);
    expect(canUseSupervisorDashboard(leader)).toBe(false);
    expect(canUseLeaderDashboard(leader)).toBe(true);
    expect(canUseLeaderDashboard(pastor)).toBe(false);
    expect(canManageGroups(pastor)).toBe(true);
    expect(canManageGroups(supervisor)).toBe(false);
    expect(canManageGroups(leader)).toBe(false);
  });

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

  it("keeps event detail management restricted to the group leader", () => {
    expect(canManageEventDetails(leader, event)).toBe(true);
    expect(canManageEventDetails(supervisor, event)).toBe(false);
    expect(canManageEventDetails(pastor, event)).toBe(false);
    expect(canManageEventDetails(otherLeader, event)).toBe(false);
  });

  it("blocks check-in for a cancelled event", () => {
    const cancelledEvent = { ...event, status: "CANCELLED" };

    expect(canCheckInEvent(leader, cancelledEvent)).toBe(false);
    expect(canManageEventDetails(leader, cancelledEvent)).toBe(true);
  });

  it("blocks check-in for future events", () => {
    const futureEvent = { ...event, startsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) };

    expect(canCheckInEvent(leader, futureEvent)).toBe(false);
  });

  it("blocks check-in for an event that starts later today", () => {
    const futureEvent = { ...event, startsAt: new Date(Date.now() + 60 * 1000) };

    expect(canCheckInEvent(leader, futureEvent)).toBe(false);
  });

  it("returns visible active group ids when registering care", () => {
    const secondGroup = {
      id: "group-2",
      churchId: "church-1",
      isActive: true,
      leaderUserId: null,
      supervisorUserId: null,
      responsibilities: [responsibility(supervisor.id, GroupResponsibilityRole.SUPERVISOR)],
    };
    const inactiveGroup = { ...group, id: "group-inactive", isActive: false };
    const multiGroupPerson = {
      churchId: "church-1",
      memberships: [
        { groupId: group.id, leftAt: null, group },
        { groupId: secondGroup.id, leftAt: null, group: secondGroup },
        { groupId: inactiveGroup.id, leftAt: null, group: inactiveGroup },
        { groupId: "group-left", leftAt: new Date(), group: { ...group, id: "group-left" } },
      ],
    };

    expect(getVisibleGroupIdsForPerson(supervisor, multiGroupPerson)).toEqual([group.id, secondGroup.id]);
    expect(getVisibleGroupIdsForPerson(leader, multiGroupPerson)).toEqual([group.id]);
    expect(getVisibleGroupIdsForPerson(pastor, multiGroupPerson)).toEqual([group.id, secondGroup.id]);
    expect(getVisibleGroupIdsForPerson(otherLeader, person)).toEqual([]);
  });

  it("returns the first visible active group when registering care", () => {
    expect(getPrimaryVisibleGroupIdForPerson(leader, person)).toBe(group.id);
    expect(getPrimaryVisibleGroupIdForPerson(otherLeader, person)).toBeUndefined();
  });

  it("builds visible membership filters for search result context", () => {
    expect(getVisibleMembershipWhere(leader)).toEqual({
      leftAt: null,
      group: { is: scopedGroupWhere(leader.id, GroupResponsibilityRole.LEADER) },
    });

    expect(getVisibleMembershipWhere(supervisor)).toEqual({
      leftAt: null,
      group: { is: scopedGroupWhere(supervisor.id, GroupResponsibilityRole.SUPERVISOR) },
    });
  });

  it("keeps query helpers scoped to active groups in the same church", () => {
    expect(getVisibleEventWhere(pastor)).toEqual({
      churchId: pastor.churchId,
      group: { is: { churchId: pastor.churchId, isActive: true } },
    });

    expect(getVisibleEventWhere(leader)).toEqual({
      churchId: leader.churchId,
      group: { is: scopedGroupWhere(leader.id, GroupResponsibilityRole.LEADER) },
    });

    expect(getVisiblePersonWhere(leader)).toEqual({
      churchId: leader.churchId,
      memberships: { some: { leftAt: null, group: { is: scopedGroupWhere(leader.id, GroupResponsibilityRole.LEADER) } } },
    });


    expect(getVisibleOpenSignalWhere(pastor)).toEqual({
      churchId: pastor.churchId,
      status: "OPEN",
      OR: [
        { groupId: null },
        { group: { is: { churchId: pastor.churchId, isActive: true } } },
      ],
    });

    expect(getVisibleOpenSignalWhere(supervisor)).toEqual({
      churchId: supervisor.churchId,
      status: "OPEN",
      group: { is: scopedGroupWhere(supervisor.id, GroupResponsibilityRole.SUPERVISOR) },
    });
  });

  it("builds active-group open signal filters for whole-church signal checks", () => {
    expect(getOpenSignalInActiveGroupWhere(pastor.churchId)).toEqual({
      churchId: pastor.churchId,
      status: "OPEN",
      OR: [
        { groupId: null },
        { group: { is: { churchId: pastor.churchId, isActive: true } } },
      ],
    });
  });

  it("builds scoped care touch filters for person detail history", () => {
    expect(getVisibleCareTouchWhere(leader, "person-1")).toEqual({
      churchId: leader.churchId,
      personId: "person-1",
      group: { is: scopedGroupWhere(leader.id, GroupResponsibilityRole.LEADER) },
    });

    expect(getVisibleCareTouchWhere(pastor, "person-1")).toEqual({
      churchId: pastor.churchId,
      personId: "person-1",
    });
  });

});
