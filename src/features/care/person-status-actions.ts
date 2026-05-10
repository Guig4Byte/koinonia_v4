import { CARE_COPY } from "@/features/care/care-copy";
import { ACTIVE_STATUS, IN_CARE_STATUS } from "@/features/people/person-status";
import { getOpenSignalInActiveGroupWhere, getVisibleOpenSignalWhere, type PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";

export type MarkPersonActiveResult =
  | { ok: true; status: typeof ACTIVE_STATUS }
  | { ok: false; status: 409; message: string };

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
    return {
      ok: false,
      status: 409,
      message: visibleOpenSignalsCount > 0
        ? CARE_COPY.statusActions.openSignalInVisibleScope
        : CARE_COPY.statusActions.openSignalOutsideScope,
    };
  }

  await prisma.person.updateMany({
    where: { id: personId, churchId: user.churchId, status: IN_CARE_STATUS },
    data: { status: ACTIVE_STATUS },
  });

  return { ok: true, status: ACTIVE_STATUS };
}
