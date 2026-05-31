import { GroupResponsibilityRole } from "@/generated/prisma/client";

export type ResponsibilityUserLike = {
  id?: string | null;
};

export type GroupResponsibilityLike = {
  userId?: string | null;
  role?: GroupResponsibilityRole | string | null;
  activeUntil?: Date | string | null;
};

export type ResponsibleGroupLike = {
  responsibilities?: GroupResponsibilityLike[];
};

export function isActiveGroupResponsibility(responsibility: GroupResponsibilityLike) {
  return responsibility.activeUntil === null || responsibility.activeUntil === undefined;
}

export function hasActiveGroupResponsibility(
  group: ResponsibleGroupLike | null | undefined,
  user: ResponsibilityUserLike | null | undefined,
  role: GroupResponsibilityRole,
) {
  if (!user?.id) return false;

  return (group?.responsibilities ?? [])
    .filter(isActiveGroupResponsibility)
    .some((responsibility) => responsibility.userId === user.id && responsibility.role === role);
}

export function hasAnyActiveGroupResponsibility(group: ResponsibleGroupLike | null | undefined, role: GroupResponsibilityRole) {
  return (group?.responsibilities ?? [])
    .filter(isActiveGroupResponsibility)
    .some((responsibility) => responsibility.role === role);
}

export function hasGroupResponsibilityScope(
  group: ResponsibleGroupLike | null | undefined,
  user: ResponsibilityUserLike | null | undefined,
  role: GroupResponsibilityRole,
) {
  return hasActiveGroupResponsibility(group, user, role);
}

export function hasAnyGroupResponsibilityScope(group: ResponsibleGroupLike | null | undefined, role: GroupResponsibilityRole) {
  return hasAnyActiveGroupResponsibility(group, role);
}
