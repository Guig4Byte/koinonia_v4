import { EventStatus, GroupResponsibilityRole, SignalStatus, UserRole, type Prisma } from "../../generated/prisma/client";

export type PermissionUser = {
  id: string;
  churchId: string;
  role: UserRole;
};

type ScopedGroupResponsibility = {
  userId?: string | null;
  role?: GroupResponsibilityRole | string | null;
  activeUntil?: Date | string | null;
};

type ScopedGroup = {
  id?: string;
  churchId: string;
  isActive?: boolean | null;
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
  responsibilities?: ScopedGroupResponsibility[];
};

type ScopedMembership = {
  groupId?: string | null;
  leftAt?: Date | string | null;
  group?: ScopedGroup | null;
};

type ScopedPerson = {
  churchId: string;
  memberships?: ScopedMembership[];
};

type ScopedEvent = {
  churchId: string;
  startsAt?: Date | string | null;
  status?: EventStatus | string | null;
  group?: ScopedGroup | null;
};

function isPastOrCurrentInstant(date: Date | string | null | undefined, referenceDate = new Date()) {
  if (!date) return false;

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) return false;

  return eventDate.getTime() <= referenceDate.getTime();
}

function isActiveResponsibility(responsibility: ScopedGroupResponsibility) {
  return responsibility.activeUntil === null || responsibility.activeUntil === undefined;
}

function hasActiveResponsibility(group: ScopedGroup | null | undefined, user: PermissionUser, role: GroupResponsibilityRole) {
  return (group?.responsibilities ?? [])
    .filter(isActiveResponsibility)
    .some((responsibility) => responsibility.userId === user.id && responsibility.role === role);
}

export function isGroupLeader(user: PermissionUser, group: ScopedGroup | null | undefined) {
  return Boolean(
    group
    && (
      hasActiveResponsibility(group, user, GroupResponsibilityRole.LEADER)
      || group.leaderUserId === user.id
    ),
  );
}

export function isGroupSupervisor(user: PermissionUser, group: ScopedGroup | null | undefined) {
  return Boolean(
    group
    && (
      hasActiveResponsibility(group, user, GroupResponsibilityRole.SUPERVISOR)
      || group.supervisorUserId === user.id
    ),
  );
}

function legacyGroupResponsibilityWhere(user: PermissionUser, role: GroupResponsibilityRole): Prisma.SmallGroupWhereInput {
  return role === GroupResponsibilityRole.LEADER
    ? { leaderUserId: user.id }
    : { supervisorUserId: user.id };
}

function scopedGroupWhere(user: PermissionUser, role: GroupResponsibilityRole): Prisma.SmallGroupWhereInput {
  return {
    churchId: user.churchId,
    isActive: true,
    OR: [
      {
        responsibilities: {
          some: {
            churchId: user.churchId,
            userId: user.id,
            role,
            activeUntil: null,
          },
        },
      },
      legacyGroupResponsibilityWhere(user, role),
    ],
  };
}

function scopedGroupRelationWhere(user: PermissionUser, role: GroupResponsibilityRole): Prisma.SmallGroupWhereInput {
  return scopedGroupWhere(user, role);
}

export function hasWholeChurchScope(user: PermissionUser) {
  return user.role === UserRole.ADMIN || user.role === UserRole.PASTOR;
}

export function canUsePastorDashboard(user: PermissionUser) {
  return hasWholeChurchScope(user);
}

export function canUseSupervisorDashboard(user: PermissionUser) {
  return user.role === UserRole.SUPERVISOR;
}

export function canUseLeaderDashboard(user: PermissionUser) {
  return user.role === UserRole.LEADER;
}

export function canViewGroup(user: PermissionUser, group: ScopedGroup | null | undefined) {
  if (!group || group.churchId !== user.churchId || group.isActive === false) return false;
  if (hasWholeChurchScope(user)) return true;
  if (user.role === UserRole.SUPERVISOR) return isGroupSupervisor(user, group);
  if (user.role === UserRole.LEADER) return isGroupLeader(user, group);
  return false;
}

export function canViewEvent(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId) return false;
  if (event.group && !canViewGroup(user, event.group)) return false;
  if (hasWholeChurchScope(user)) return true;
  return canViewGroup(user, event.group);
}

export function canCheckInEvent(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId || !event.group || !isPastOrCurrentInstant(event.startsAt)) return false;
  if (event.status === EventStatus.CANCELLED) return false;
  return user.role === UserRole.LEADER && canViewGroup(user, event.group) && isGroupLeader(user, event.group);
}

export function canManageEventDetails(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId || !event.group || !canViewGroup(user, event.group)) return false;
  if (hasWholeChurchScope(user)) return true;
  if (user.role === UserRole.SUPERVISOR) return isGroupSupervisor(user, event.group);
  if (user.role === UserRole.LEADER) return isGroupLeader(user, event.group);
  return false;
}

function isActiveMembership(membership: ScopedMembership) {
  return membership.leftAt === null || membership.leftAt === undefined;
}

export function canViewPerson(user: PermissionUser, person: ScopedPerson | null | undefined) {
  if (!person || person.churchId !== user.churchId) return false;
  if (hasWholeChurchScope(user)) return true;

  return (person.memberships ?? [])
    .filter(isActiveMembership)
    .some((membership) => canViewGroup(user, membership.group));
}

export function canRegisterCare(user: PermissionUser, person: ScopedPerson | null | undefined) {
  return canViewPerson(user, person);
}

export function getVisibleGroupIdsForPerson(user: PermissionUser, person: ScopedPerson | null | undefined) {
  if (!person || person.churchId !== user.churchId) return [];

  const visibleGroupIds = (person.memberships ?? [])
    .filter(isActiveMembership)
    .filter((membership) => canViewGroup(user, membership.group))
    .map((membership) => membership.groupId ?? membership.group?.id)
    .filter((groupId): groupId is string => Boolean(groupId));

  return Array.from(new Set(visibleGroupIds));
}

export function getPrimaryVisibleGroupIdForPerson(user: PermissionUser, person: ScopedPerson | null | undefined) {
  return getVisibleGroupIdsForPerson(user, person)[0];
}

export function getVisibleGroupWhere(user: PermissionUser): Prisma.SmallGroupWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId, isActive: true };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR);
  }

  return scopedGroupWhere(user, GroupResponsibilityRole.LEADER);
}

export function getVisibleEventWhere(user: PermissionUser): Prisma.EventWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId, group: { is: { churchId: user.churchId, isActive: true } } };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return { churchId: user.churchId, group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.SUPERVISOR) } };
  }

  return { churchId: user.churchId, group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.LEADER) } };
}

export function getVisibleMembershipWhere(user: PermissionUser): Prisma.GroupMembershipWhereInput {
  if (hasWholeChurchScope(user)) {
    return { leftAt: null, group: { is: { churchId: user.churchId, isActive: true } } };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      leftAt: null,
      group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    leftAt: null,
    group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.LEADER) },
  };
}

export function getVisiblePersonWhere(user: PermissionUser): Prisma.PersonWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      churchId: user.churchId,
      memberships: { some: { leftAt: null, group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.SUPERVISOR) } } },
    };
  }

  return {
    churchId: user.churchId,
    memberships: { some: { leftAt: null, group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.LEADER) } } },
  };
}

export function getOpenSignalInActiveGroupWhere(churchId: string): Prisma.CareSignalWhereInput {
  return {
    churchId,
    status: SignalStatus.OPEN,
    OR: [
      { groupId: null },
      { group: { is: { churchId, isActive: true } } },
    ],
  };
}

export function getVisibleOpenSignalWhere(user: PermissionUser): Prisma.CareSignalWhereInput {
  if (hasWholeChurchScope(user)) {
    return getOpenSignalInActiveGroupWhere(user.churchId);
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      churchId: user.churchId,
      status: SignalStatus.OPEN,
      group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    churchId: user.churchId,
    status: SignalStatus.OPEN,
    group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.LEADER) },
  };
}

export function getVisibleCareTouchWhere(user: PermissionUser, personId?: string): Prisma.CareTouchWhereInput {
  const base: Prisma.CareTouchWhereInput = {
    churchId: user.churchId,
    ...(personId ? { personId } : {}),
  };

  if (hasWholeChurchScope(user)) {
    return base;
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      ...base,
      group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    ...base,
    group: { is: scopedGroupRelationWhere(user, GroupResponsibilityRole.LEADER) },
  };
}
