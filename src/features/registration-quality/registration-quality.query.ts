import { GroupResponsibilityRole, PersonStatus } from "@/generated/prisma/client";
import { activeMembershipWhere } from "@/features/groups/group-query";
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
        status: true,
        memberships: {
          where: activeMembershipWhere,
          select: {
            role: true,
            group: { select: { id: true, name: true } },
          },
          orderBy: { joinedAt: "asc" },
          take: 1,
        },
        user: {
          select: {
            role: true,
            groupResponsibilities: {
              where: {
                churchId: user.churchId,
                activeUntil: null,
                group: { is: { isActive: true } },
              },
              select: {
                role: true,
                group: { select: { id: true, name: true } },
              },
            },
          },
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
    people: people.map(({ memberships, user: personUser, ...person }) => {
      const responsibilities = personUser?.groupResponsibilities ?? [];
      const ledGroups = responsibilities
        .filter((responsibility) => responsibility.role === GroupResponsibilityRole.LEADER)
        .map((responsibility) => responsibility.group)
        .sort((current, next) => current.name.localeCompare(next.name, "pt-BR", { sensitivity: "base" }));
      const supervisedGroups = responsibilities
        .filter((responsibility) => responsibility.role === GroupResponsibilityRole.SUPERVISOR)
        .map((responsibility) => responsibility.group)
        .sort((current, next) => current.name.localeCompare(next.name, "pt-BR", { sensitivity: "base" }));

      return {
        ...person,
        primaryGroup: memberships?.[0]?.group ?? null,
        primaryMembershipRole: memberships?.[0]?.role ?? null,
        ledGroups,
        supervisedGroups,
        hasSystemAccess: Boolean(personUser),
        systemRole: personUser?.role ?? null,
      };
    }),
    users: users.map((user) => ({
      ...user,
      role: userRoleLabels[user.role],
    })),
  });
}
