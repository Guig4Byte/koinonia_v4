import { CareKind, SignalStatus } from "@/generated/prisma/client";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { canViewGroup, type PermissionUser } from "@/features/permissions/permissions";
import { canEscalateSignalToPastor, canRequestSupervisorSupport } from "./escalation";
import {
  assignSignalWithCareTouch,
  findPastoralAssignee,
  supervisorAssigneeIdFromGroup,
} from "./signal-assignment";
import { SIGNAL_COPY } from "./signal-copy";
import type { ParsedSignalSupportPayload } from "./support-payload";
import { prisma } from "@/lib/prisma";

export type SignalSupportCommandSuccess = {
  assignedToId: string | null;
  assignedToName?: string;
  message: string;
};

export type SignalSupportCommandResult =
  | { ok: true; data: SignalSupportCommandSuccess }
  | { ok: false; status: number; message: string };

type SignalSupportInput = {
  user: PermissionUser;
  signalId: string;
  payload: ParsedSignalSupportPayload;
};

type SupportSignal = NonNullable<Awaited<ReturnType<typeof findSignalForSupport>>>;

function signalSupportError(message: string, status: number): SignalSupportCommandResult {
  return { ok: false, message, status };
}

function signalSupportSuccess(input: {
  assignedToId: string | null;
  assignedToName?: string | null;
  message: string;
}): SignalSupportCommandResult {
  return {
    ok: true,
    data: {
      assignedToId: input.assignedToId,
      assignedToName: input.assignedToName ?? undefined,
      message: input.message,
    },
  };
}

async function findSignalForSupport(signalId: string) {
  return prisma.careSignal.findUnique({
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
}

async function requestSupervisorSupport(
  user: PermissionUser,
  signal: SupportSignal,
  note?: string,
): Promise<SignalSupportCommandResult> {
  if (!canRequestSupervisorSupport(user, signal)) {
    return signalSupportError(SIGNAL_COPY.errors.leaderOnlySupervisorRequest, 403);
  }

  const supervisorAssigneeId = supervisorAssigneeIdFromGroup(signal.group);

  if (!supervisorAssigneeId) {
    return signalSupportError(SIGNAL_COPY.errors.noSupervisor, 400);
  }

  const updated = await prisma.$transaction((tx) => assignSignalWithCareTouch({
    tx,
    signal,
    actorId: user.id,
    assignedToId: supervisorAssigneeId,
    kind: CareKind.REQUESTED_SUPPORT,
    note,
  }));

  return signalSupportSuccess({
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name,
    message: SIGNAL_COPY.support.requested.apiMessage,
  });
}

async function escalateSignalToPastor(
  user: PermissionUser,
  signal: SupportSignal,
  note?: string,
): Promise<SignalSupportCommandResult> {
  if (!canEscalateSignalToPastor(user, signal)) {
    return signalSupportError(SIGNAL_COPY.errors.leaderOrSupervisorOnlyPastoralEscalation, 403);
  }

  const pastoralAssignee = await findPastoralAssignee(user.churchId);

  if (!pastoralAssignee) {
    return signalSupportError(SIGNAL_COPY.errors.noPastoralAssignee, 400);
  }

  const updated = await prisma.$transaction((tx) => assignSignalWithCareTouch({
    tx,
    signal,
    actorId: user.id,
    assignedToId: pastoralAssignee.id,
    kind: CareKind.ESCALATED_TO_PASTOR,
    note,
  }));

  return signalSupportSuccess({
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name,
    message: SIGNAL_COPY.pastoralEscalation.apiMessage,
  });
}

export async function requestSignalSupport({
  user,
  signalId,
  payload,
}: SignalSupportInput): Promise<SignalSupportCommandResult> {
  const signal = await findSignalForSupport(signalId);

  if (!signal || signal.churchId !== user.churchId || signal.status !== SignalStatus.OPEN) {
    return signalSupportError(SIGNAL_COPY.errors.signalNotFound, 404);
  }

  if (!canViewGroup(user, signal.group)) {
    return signalSupportError(SIGNAL_COPY.errors.noCarePermission, 403);
  }

  if (payload.action === "REQUEST_SUPERVISOR") {
    return requestSupervisorSupport(user, signal, payload.note);
  }

  return escalateSignalToPastor(user, signal, payload.note);
}
