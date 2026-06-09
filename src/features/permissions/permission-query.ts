import { GroupResponsibilityRole, SignalStatus, UserRole, type Prisma } from "@/generated/prisma/client";
import { activeGroupResponsibilityWhere } from "@/lib/domain/group-responsibility-query";

export type PermissionUser = {
  id: string;
  churchId: string;
  role: UserRole;
};

function scopedGroupWhere(user: PermissionUser, role: GroupResponsibilityRole): Prisma.SmallGroupWhereInput {
  return {
    churchId: user.churchId,
    isActive: true,
    responsibilities: {
      some: {
        churchId: user.churchId,
        userId: user.id,
        ...activeGroupResponsibilityWhere(role),
      },
    },
  };
}

export function hasWholeChurchScope(user: PermissionUser) {
  return user.role === UserRole.ADMIN || user.role === UserRole.PASTOR;
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
    return { churchId: user.churchId, group: { is: scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR) } };
  }

  return { churchId: user.churchId, group: { is: scopedGroupWhere(user, GroupResponsibilityRole.LEADER) } };
}

export function getVisibleMembershipWhere(user: PermissionUser): Prisma.GroupMembershipWhereInput {
  if (hasWholeChurchScope(user)) {
    return { leftAt: null, group: { is: { churchId: user.churchId, isActive: true } } };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      leftAt: null,
      group: { is: scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    leftAt: null,
    group: { is: scopedGroupWhere(user, GroupResponsibilityRole.LEADER) },
  };
}

export function getVisiblePersonWhere(user: PermissionUser): Prisma.PersonWhereInput {
  if (hasWholeChurchScope(user)) {
    return { churchId: user.churchId };
  }

  if (user.role === UserRole.SUPERVISOR) {
    return {
      churchId: user.churchId,
      memberships: { some: { leftAt: null, group: { is: scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR) } } },
    };
  }

  return {
    churchId: user.churchId,
    memberships: { some: { leftAt: null, group: { is: scopedGroupWhere(user, GroupResponsibilityRole.LEADER) } } },
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
      group: { is: scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    churchId: user.churchId,
    status: SignalStatus.OPEN,
    group: { is: scopedGroupWhere(user, GroupResponsibilityRole.LEADER) },
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
      group: { is: scopedGroupWhere(user, GroupResponsibilityRole.SUPERVISOR) },
    };
  }

  return {
    ...base,
    group: { is: scopedGroupWhere(user, GroupResponsibilityRole.LEADER) },
  };
}
