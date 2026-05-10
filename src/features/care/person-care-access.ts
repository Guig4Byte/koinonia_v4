import { canRegisterCare, getVisibleGroupIdsForPerson, type PermissionUser } from "@/features/permissions/permissions";
import { activeGroupResponsibilitiesScopeInclude } from "@/features/groups/group-query";
import { prisma } from "@/lib/prisma";

export type PersonCareAccessOptions = {
  notFoundMessage?: string;
  forbiddenMessage?: string;
};

export async function findPersonForCareAction(
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
      message: options.notFoundMessage ?? "Pessoa não encontrada",
    };
  }

  if (!canRegisterCare(user, person)) {
    return {
      ok: false as const,
      status: 403,
      message: options.forbiddenMessage ?? "Sem permissão para registrar cuidado",
    };
  }

  return {
    ok: true as const,
    person,
    visibleGroupIds: getVisibleGroupIdsForPerson(user, person),
  };
}
