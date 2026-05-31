import { GroupResponsibilityRole } from "@/generated/prisma/client";

export const activeGroupResponsibilitiesInclude = {
  where: { activeUntil: null },
  include: { user: true },
  orderBy: { createdAt: "asc" as const },
};

export const activeGroupResponsibilitiesScopeInclude = {
  where: { activeUntil: null },
};

export const groupWithActiveResponsibilitiesInclude = {
  responsibilities: activeGroupResponsibilitiesInclude,
};

export const groupWithActiveResponsibilityScopeInclude = {
  responsibilities: activeGroupResponsibilitiesScopeInclude,
};

export function activeGroupResponsibilityWhere(role: GroupResponsibilityRole) {
  return { role, activeUntil: null };
}

export function activeGroupResponsibilityUserSelect(role: GroupResponsibilityRole) {
  return {
    where: activeGroupResponsibilityWhere(role),
    select: { userId: true },
    orderBy: { createdAt: "asc" as const },
  };
}
