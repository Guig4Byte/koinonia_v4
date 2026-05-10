import { NextRequest } from "next/server";
import { SignalStatus } from "@/generated/prisma/client";
import { findPersonForCareAction } from "@/features/care/person-care-access";
import { parseCarePayload, resolvedAttentionMessage } from "@/features/care/care-validation";
import { ATTENTION_ELIGIBLE_PERSON_STATUSES, IN_CARE_STATUS } from "@/features/people/person-status";
import {
  getOpenSignalInActiveGroupWhere,
  hasWholeChurchScope,
} from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parseCarePayload(await readJsonBody(request));

  if (!parsedBody.success) {
    return apiError("Dados de cuidado inválidos", 400);
  }

  const body = parsedBody.data;
  const personAccess = await findPersonForCareAction(user, personId);

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

  const visibleGroupIds = personAccess.visibleGroupIds;
  const visibleGroupId = visibleGroupIds[0];

  if (!hasWholeChurchScope(user) && visibleGroupIds.length === 0) {
    return apiError("Sem célula visível para registrar este cuidado", 403);
  }

  const result = await prisma.$transaction(async (tx) => {
    const careTouch = await tx.careTouch.create({
      data: {
        churchId: user.churchId,
        personId,
        actorId: user.id,
        kind: body.kind,
        note: body.note,
        groupId: visibleGroupId,
      },
    });

    let resolvedSignalsCount = 0;
    let personStatusChangedToCare = false;

    if (body.resolveOpenSignals) {
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

  return apiOk({
    careTouchId: result.careTouchId,
    resolvedSignalsCount: result.resolvedSignalsCount,
    personStatusChangedToCare: result.personStatusChangedToCare,
    message: resolvedAttentionMessage(result.resolvedSignalsCount, result.personStatusChangedToCare),
  });
}
