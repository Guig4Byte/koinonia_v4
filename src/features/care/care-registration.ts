import { SignalStatus, type CareKind } from "@/generated/prisma/client";
import { resolvedAttentionMessage } from "@/features/care/care-copy";
import { ATTENTION_ELIGIBLE_PERSON_STATUSES, IN_CARE_STATUS } from "@/features/people/person-status";
import { getOpenSignalInActiveGroupWhere, hasWholeChurchScope, type PermissionUser } from "@/features/permissions/permissions";
import { prisma } from "@/lib/prisma";

type RegisterCareInput = {
  user: PermissionUser;
  personId: string;
  kind: CareKind;
  note?: string;
  resolveOpenSignals: boolean;
  visibleGroupIds: string[];
};

type RegisterCareResult = {
  careTouchId: string;
  resolvedSignalsCount: number;
  personStatusChangedToCare: boolean;
  message: string;
};

export async function registerCareAndResolveAttention({
  user,
  personId,
  kind,
  note,
  resolveOpenSignals,
  visibleGroupIds,
}: RegisterCareInput): Promise<RegisterCareResult> {
  const visibleGroupId = visibleGroupIds[0];

  const result = await prisma.$transaction(async (tx) => {
    const careTouch = await tx.careTouch.create({
      data: {
        churchId: user.churchId,
        personId,
        actorId: user.id,
        kind,
        note,
        groupId: visibleGroupId,
      },
    });

    let resolvedSignalsCount = 0;
    let personStatusChangedToCare = false;

    if (resolveOpenSignals) {
      const resolvableOpenSignalWhere = hasWholeChurchScope(user)
        ? { ...getOpenSignalInActiveGroupWhere(user.churchId), personId }
        : { churchId: user.churchId, personId, status: SignalStatus.OPEN, groupId: { in: visibleGroupIds } };

      const updateResult = await tx.careSignal.updateMany({
        where: resolvableOpenSignalWhere,
        data: { status: SignalStatus.RESOLVED, resolvedAt: new Date() },
      });

      resolvedSignalsCount = updateResult.count;

      const remainingOpenSignals = await tx.careSignal.count({
        where: { ...getOpenSignalInActiveGroupWhere(user.churchId), personId },
      });

      if (remainingOpenSignals === 0) {
        const personUpdate = await tx.person.updateMany({
          where: {
            id: personId,
            churchId: user.churchId,
            status: { in: ATTENTION_ELIGIBLE_PERSON_STATUSES },
          },
          data: { status: IN_CARE_STATUS },
        });

        personStatusChangedToCare = personUpdate.count > 0;
      }
    }

    return { careTouchId: careTouch.id, resolvedSignalsCount, personStatusChangedToCare };
  });

  return {
    ...result,
    message: resolvedAttentionMessage(result.resolvedSignalsCount, result.personStatusChangedToCare),
  };
}
