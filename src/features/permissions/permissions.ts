import { EventStatus, GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import { hasGroupResponsibilityScope, type ResponsibleGroupLike } from "@/features/groups/responsibility-scope";
import { hasWholeChurchScope } from "./permission-query";
import type { PermissionUser } from "./permission-query";

export type { PermissionUser } from "./permission-query";
export {
  getOpenSignalInActiveGroupWhere,
  getVisibleCareTouchWhere,
  getVisibleEventWhere,
  getVisibleGroupWhere,
  getVisibleMembershipWhere,
  getVisibleOpenSignalWhere,
  getVisiblePersonWhere,
  hasWholeChurchScope,
} from "./permission-query";

type ScopedGroup = ResponsibleGroupLike & {
  id?: string;
  churchId: string;
  isActive?: boolean | null;
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

export function isGroupLeader(user: PermissionUser, group: ScopedGroup | null | undefined) {
  return hasGroupResponsibilityScope(group, user, GroupResponsibilityRole.LEADER);
}

export function isGroupSupervisor(user: PermissionUser, group: ScopedGroup | null | undefined) {
  return hasGroupResponsibilityScope(group, user, GroupResponsibilityRole.SUPERVISOR);
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

export function canManageGroups(user: PermissionUser) {
  return hasWholeChurchScope(user);
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
  if (event.status === EventStatus.CANCELLED || event.status === EventStatus.NO_MEETING) return false;
  return user.role === UserRole.LEADER && canViewGroup(user, event.group) && isGroupLeader(user, event.group);
}

export function canManageEventDetails(user: PermissionUser, event: ScopedEvent | null | undefined) {
  if (!event || event.churchId !== user.churchId || !event.group || !canViewGroup(user, event.group)) return false;
  return user.role === UserRole.LEADER && isGroupLeader(user, event.group);
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

export function isPastoralRole(
  viewer: UserRole | { role: UserRole } | null | undefined,
): boolean {
  const role = typeof viewer === "string" ? viewer : viewer?.role;
  return role === UserRole.PASTOR || role === UserRole.ADMIN;
}
