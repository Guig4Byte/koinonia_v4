import { GroupResponsibilityRole, UserRole, type CareKind } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AssignableSignal = {
  id: string;
  churchId: string;
  personId: string;
  groupId: string | null;
};

export type AssignedSignalResult = {
  assignedToId: string | null;
  assignedTo?: { name: string } | null;
};

type SignalAssignmentTx = Pick<typeof prisma, "careSignal" | "careTouch">;
type SignalAssignmentCareKind = Extract<CareKind, "REQUESTED_SUPPORT" | "ESCALATED_TO_PASTOR">;

type AssignSignalWithCareTouchInput = {
  tx: SignalAssignmentTx;
  signal: AssignableSignal;
  actorId: string;
  assignedToId: string;
  kind: SignalAssignmentCareKind;
  note?: string;
};

export function supervisorAssigneeIdFromGroup(
  group: { responsibilities?: Array<{ role: GroupResponsibilityRole; userId: string }> } | null | undefined,
) {
  return group?.responsibilities?.find((responsibility) => responsibility.role === GroupResponsibilityRole.SUPERVISOR)?.userId;
}

export async function findPastoralAssignee(churchId: string) {
  return prisma.user.findFirst({
    where: { churchId, role: { in: [UserRole.PASTOR, UserRole.ADMIN] }, isActive: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function assignSignalWithCareTouch({
  tx,
  signal,
  actorId,
  assignedToId,
  kind,
  note,
}: AssignSignalWithCareTouchInput): Promise<AssignedSignalResult> {
  const updatedSignal = await tx.careSignal.update({
    where: { id: signal.id },
    data: { assignedToId },
    include: { assignedTo: true },
  });

  await tx.careTouch.create({
    data: {
      churchId: signal.churchId,
      personId: signal.personId,
      groupId: signal.groupId,
      actorId,
      kind,
      note,
    },
  });

  return updatedSignal;
}
