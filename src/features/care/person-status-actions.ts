import { CARE_COPY } from "@/features/care/care-copy";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import { ACTIVE_STATUS, IN_CARE_STATUS } from "@/features/people/person-status";
import { getOpenSignalInActiveGroupWhere, getVisibleOpenSignalWhere, type PermissionUser } from "@/features/permissions/permissions";
import { commandError, commandOk, type ApiCommandResult } from "@/lib/api-command-result";
import { prisma } from "@/lib/prisma";

export type MarkPersonActiveResult = ApiCommandResult<{
  status: typeof ACTIVE_STATUS;
}>;

export async function markCareVisiblePersonActiveAfterCare(
  user: PermissionUser,
  personId: string,
): Promise<MarkPersonActiveResult> {
  const personAccess = await requireCareVisiblePerson(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });

  if (!personAccess.ok) {
    return commandError(personAccess.message, personAccess.status);
  }

  return markPersonActiveAfterCare(user, personAccess.person.id);
}

export async function markPersonActiveAfterCare(user: PermissionUser, personId: string): Promise<MarkPersonActiveResult> {
  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const [visibleOpenSignalsCount, openSignalsCount] = await Promise.all([
    prisma.careSignal.count({
      where: { ...visibleOpenSignalWhere, personId },
    }),
    prisma.careSignal.count({
      where: { ...getOpenSignalInActiveGroupWhere(user.churchId), personId },
    }),
  ]);

  if (openSignalsCount > 0) {
    return commandError(
      visibleOpenSignalsCount > 0
        ? CARE_COPY.statusActions.openSignalInVisibleScope
        : CARE_COPY.statusActions.openSignalOutsideScope,
      409,
    );
  }

  await prisma.person.updateMany({
    where: { id: personId, churchId: user.churchId, status: IN_CARE_STATUS },
    data: { status: ACTIVE_STATUS },
  });

  return commandOk({ status: ACTIVE_STATUS });
}
