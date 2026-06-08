import { PersonStatus } from "@/generated/prisma/client";
import { canUsePastorDashboard, type PermissionUser } from "@/features/permissions/permissions";
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
        fullName: true,
        phone: true,
      },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({
      where: {
        churchId: user.churchId,
        isActive: true,
      },
      select: {
        email: true,
        personId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return buildRegistrationQualitySummary({ people, users });
}
