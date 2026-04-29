import { SignalStatus, UserRole, type Prisma } from "../../generated/prisma/client";

export type PermissionUser = {
  id: string;
  churchId: string;
  role: UserRole;
};

type ScopedGroup = {
  id?: string;
  churchId: string;
  isActive?: boolean | null;
  leaderUserId?: string | null;
  supervisorUserId?: string | null;
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
  group?: ScopedGroup | null;
};

function isTodayOrPast(date: Date | string | null | undefined, referenceDate = new Date()) {
  if (!date) return false;

  const eventDate = new Date(date);
  if (Number.isNaN(eventDate.getTime())) return false;

  const tomorrow = new Date(referenceDate);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return eventDate < tomorrow;
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
  if (user.role === UserRole.SUPERVISOR) return group.supervisorUserId === user.id;
  if (user.role === UserRole.LEADER) return group.leaderUserId === user.id;
  return false;
}

export function canViewEvent(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId) return false;
  if (event.group && !canViewGroup(user, event.group)) return false;
  if (hasWholeChurchScope(user)) return true;
  return canViewGroup(user, event.group);
}

export function canCheckInEvent(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId || !event.group || !isTodayOrPast(event.startsAt)) return false;
  return user.role === UserRole.LEADER && canViewGroup(user, event.group) && event.group.leaderUserId === user.id;
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

export function getPrimaryVisibleGroupIdForPerson(user: PermissionUser, person: ScopedPerson | null | undefined) {
  if (!person || person.churchId !== user.churchId) return undefined;

  const memberships = (person.memberships ?? []).filter(isActiveMembership);
  const visibleMembership = memberships.find((membership) => canViewGroup(user, membership.group));

  return visibleMembership?.groupId ?? visibleMembership?.group?.id;
}

export function getVisibleGroupWhere(user: PermissionUser): Prisma.SmallGroupWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId, isActive: true };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return { churchId: user.churchId, isActive: true, supervisorUserId: user.id };
  }

  return { churchId: user.churchId, isActive: true, leaderUserId: user.id };
}

export function getVisibleEventWhere(user: PermissionUser): Prisma.EventWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId, group: { is: { churchId: user.churchId, isActive: true } } };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return { churchId: user.churchId, group: { is: { churchId: user.churchId, isActive: true, supervisorUserId: user.id } } };
  }

  return { churchId: user.churchId, group: { is: { churchId: user.churchId, isActive: true, leaderUserId: user.id } } };
}

export function getVisibleMembershipWhere(user: PermissionUser): Prisma.GroupMembershipWhereInput {
  if (hasWholeChurchScope(user)) {
    return { leftAt: null, group: { is: { churchId: user.churchId, isActive: true } } };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      leftAt: null,
      group: { is: { churchId: user.churchId, isActive: true, supervisorUserId: user.id } },
    };
  }

  return {
    leftAt: null,
    group: { is: { churchId: user.churchId, isActive: true, leaderUserId: user.id } },
  };
}

export function getVisiblePersonWhere(user: PermissionUser): Prisma.PersonWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      churchId: user.churchId,
      memberships: { some: { leftAt: null, group: { is: { churchId: user.churchId, isActive: true, supervisorUserId: user.id } } } },
    };
  }

  return {
    churchId: user.churchId,
    memberships: { some: { leftAt: null, group: { is: { churchId: user.churchId, isActive: true, leaderUserId: user.id } } } },
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
      group: { is: { churchId: user.churchId, isActive: true, supervisorUserId: user.id } },
    };
  }

  return {
    churchId: user.churchId,
    status: SignalStatus.OPEN,
    group: { is: { churchId: user.churchId, isActive: true, leaderUserId: user.id } },
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
      group: { is: { churchId: user.churchId, isActive: true, supervisorUserId: user.id } },
    };
  }

  return {
    ...base,
    group: { is: { churchId: user.churchId, isActive: true, leaderUserId: user.id } },
  };
}
