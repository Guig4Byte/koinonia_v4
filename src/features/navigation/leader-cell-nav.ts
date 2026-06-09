import { GroupKind, UserRole } from "@/generated/prisma/client";
import { getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";
import { ROUTES } from "@/lib/routes";

type UserWithRole = { role: UserRole };

export function leaderCellHrefFromGroup(user: UserWithRole, groupId?: string | null) {
  if (user.role !== UserRole.LEADER) return undefined;
  return groupId ? ROUTES.group(groupId) : ROUTES.cells;
}

export async function leaderCellHrefForUser(user: PermissionUser) {
  if (user.role !== UserRole.LEADER) return undefined;

  const primaryGroup = await prisma.smallGroup.findFirst({
    where: {
      ...getVisibleGroupWhere(user),
      kind: GroupKind.CELL,
    },
    select: { id: true },
    orderBy: { name: "asc" },
  });

  return leaderCellHrefFromGroup(user, primaryGroup?.id);
}
