import { CARE_COPY } from "@/features/care/care-copy";
import { findPersonForCareAction } from "@/features/care/person-care-access";
import { ACTIVE_STATUS, IN_CARE_STATUS } from "@/features/people/person-status";
import { getOpenSignalInActiveGroupWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;

  const personAccess = await findPersonForCareAction(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

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
    const error = visibleOpenSignalsCount > 0
      ? CARE_COPY.statusActions.openSignalInVisibleScope
      : CARE_COPY.statusActions.openSignalOutsideScope;

    return apiError(error, 409);
  }

  await prisma.person.updateMany({
    where: { id: personId, churchId: user.churchId, status: IN_CARE_STATUS },
    data: { status: ACTIVE_STATUS },
  });

  return apiOk({ status: ACTIVE_STATUS });
}
