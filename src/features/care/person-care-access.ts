import { canRegisterCare, getVisibleGroupIdsForPerson, type PermissionUser } from "@/features/permissions/permissions";
import { CARE_COPY } from "@/features/care/care-copy";
import { activeGroupResponsibilitiesScopeInclude } from "@/lib/domain/group-responsibility-query";
import { prisma } from "@/lib/prisma";

export type PersonCareAccessOptions = {
  notFoundMessage?: string;
  forbiddenMessage?: string;
};

export async function requireCareVisiblePerson(
  user: PermissionUser,
  personId: string,
  options: PersonCareAccessOptions = {},
) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: {
          group: {
            include: {
              responsibilities: activeGroupResponsibilitiesScopeInclude,
            },
          },
        },
      },
    },
  });

  if (!person || person.churchId !== user.churchId) {
    return {
      ok: false as const,
      status: 404,
      message: options.notFoundMessage ?? CARE_COPY.errors.personNotFound,
    };
  }

  if (!canRegisterCare(user, person)) {
    return {
      ok: false as const,
      status: 403,
      message: options.forbiddenMessage ?? CARE_COPY.errors.noPermission,
    };
  }

  return {
    ok: true as const,
    person,
    visibleGroupIds: getVisibleGroupIdsForPerson(user, person),
  };
}

export const findPersonForCareAction = requireCareVisiblePerson;
