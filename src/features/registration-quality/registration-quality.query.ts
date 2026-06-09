import { PersonStatus } from "@/generated/prisma/client";
import { activeNonVisitorMembershipWhere } from "@/features/groups/group-query";
import { canUsePastorDashboard, type PermissionUser } from "@/features/permissions/permissions";
import { userRoleLabels } from "@/features/users/user-display";
import { prisma } from "@/lib/prisma";
import { buildRegistrationQualitySummary } from "./registration-quality";

export async function getRegistrationQualitySummary(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getRegistrationQualitySummary requires pastor or admin scope");
  }

  const [people, users] = await Promise.all([
    prisma.person.findMany({
      where: {
        churchId: user.churchId,
        status: { not: PersonStatus.INACTIVE },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        memberships: {
          where: activeNonVisitorMembershipWhere,
          select: {
            group: { select: { id: true, name: true } },
          },
          orderBy: { joinedAt: "asc" },
          take: 1,
        },
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: {
        churchId: user.churchId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        personId: true,
        person: { select: { id: true, fullName: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return buildRegistrationQualitySummary({
    people: people.map(({ memberships, ...person }) => ({
      ...person,
      primaryGroup: memberships?.[0]?.group ?? null,
    })),
    users: users.map((user) => ({
      ...user,
      role: userRoleLabels[user.role],
    })),
  });
}
