import { NextRequest } from "next/server";
import { CareKind, GroupResponsibilityRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { canViewGroup } from "@/features/permissions/permissions";
import { canEscalateSignalToPastor, canRequestSupervisorSupport } from "@/features/signals/escalation";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";
import { getCurrentUser } from "@/lib/auth/current-user";
import { parseSignalSupportPayload } from "@/features/signals/support-payload";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

async function findPastoralAssignee(churchId: string) {
  return prisma.user.findFirst({
    where: { churchId, role: { in: [UserRole.PASTOR, UserRole.ADMIN] } },
    orderBy: { createdAt: "asc" },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ signalId: string }> }) {
  const user = await getCurrentUser();
  const { signalId } = await context.params;
  const payload = parseSignalSupportPayload(await readJsonBody(request));

  if (!payload) {
    return apiError(SIGNAL_COPY.errors.invalidSupportRequest, 400);
  }

  const { action, note } = payload;

  const signal = await prisma.careSignal.findUnique({
    where: { id: signalId },
    include: {
      group: {
        include: {
          responsibilities: activeGroupResponsibilitiesInclude,
        },
      },
      assignedTo: true,
    },
  });

  if (!signal || signal.churchId !== user.churchId || signal.status !== SignalStatus.OPEN) {
    return apiError(SIGNAL_COPY.errors.signalNotFound, 404);
  }

  if (!canViewGroup(user, signal.group)) {
    return apiError(SIGNAL_COPY.errors.noCarePermission, 403);
  }

  if (action === "REQUEST_SUPERVISOR") {
    if (!canRequestSupervisorSupport(user, signal)) {
      return apiError(SIGNAL_COPY.errors.leaderOnlySupervisorRequest, 403);
    }

    const supervisorAssigneeId = signal.group?.responsibilities.find(
      (responsibility) => responsibility.role === GroupResponsibilityRole.SUPERVISOR,
    )?.userId;

    if (!supervisorAssigneeId) {
      return apiError(SIGNAL_COPY.errors.noSupervisor, 400);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSignal = await tx.careSignal.update({
        where: { id: signal.id },
        data: { assignedToId: supervisorAssigneeId },
        include: { assignedTo: true },
      });

      await tx.careTouch.create({
        data: {
          churchId: user.churchId,
          personId: signal.personId,
          groupId: signal.groupId,
          actorId: user.id,
          kind: CareKind.REQUESTED_SUPPORT,
          note,
        },
      });

      return updatedSignal;
    });

    return apiOk({
      assignedToId: updated.assignedToId,
      assignedToName: updated.assignedTo?.name,
      message: SIGNAL_COPY.support.requested.apiMessage,
    });
  }

  if (!canEscalateSignalToPastor(user, signal)) {
    return apiError(SIGNAL_COPY.errors.leaderOrSupervisorOnlyPastoralEscalation, 403);
  }

  const pastoralAssignee = await findPastoralAssignee(user.churchId);

  if (!pastoralAssignee) {
    return apiError(SIGNAL_COPY.errors.noPastoralAssignee, 400);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedSignal = await tx.careSignal.update({
      where: { id: signal.id },
      data: { assignedToId: pastoralAssignee.id },
      include: { assignedTo: true },
    });

    await tx.careTouch.create({
      data: {
        churchId: user.churchId,
        personId: signal.personId,
        groupId: signal.groupId,
        actorId: user.id,
        kind: CareKind.ESCALATED_TO_PASTOR,
        note,
      },
    });

    return updatedSignal;
  });

  return apiOk({
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name,
    message: SIGNAL_COPY.pastoralEscalation.apiMessage,
  });
}
