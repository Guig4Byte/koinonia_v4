import { NextRequest, NextResponse } from "next/server";
import { CareKind, GroupResponsibilityRole, SignalStatus, UserRole } from "@/generated/prisma/client";
import { canViewGroup } from "@/features/permissions/permissions";
import { canEscalateSignalToPastor, canRequestSupervisorSupport } from "@/features/signals/escalation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isRecord, readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

const supportActions = ["REQUEST_SUPERVISOR", "ESCALATE_PASTOR"] as const;
type SupportAction = (typeof supportActions)[number];

type ParsedSupportPayload = {
  action: SupportAction;
  note?: string;
};

const supportActionValues = new Set<string>(supportActions);

function isSupportAction(value: unknown): value is SupportAction {
  return typeof value === "string" && supportActionValues.has(value);
}

function parseSupportPayload(input: unknown): ParsedSupportPayload | null {
  if (!isRecord(input)) return null;

  const action = input.action;
  if (!isSupportAction(action)) return null;

  const rawNote = input.note;
  if (rawNote !== undefined && typeof rawNote !== "string") return null;

  const note = rawNote?.trim();
  if (note && note.length > 500) return null;

  return {
    action,
    note: note && note.length > 0 ? note : undefined,
  };
}

async function findPastoralAssignee(churchId: string) {
  return prisma.user.findFirst({
    where: { churchId, role: { in: [UserRole.PASTOR, UserRole.ADMIN] } },
    orderBy: { createdAt: "asc" },
  });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ signalId: string }> }) {
  const user = await getCurrentUser();
  const { signalId } = await context.params;
  const payload = parseSupportPayload(await readJsonBody(request));

  if (!payload) {
    return NextResponse.json({ error: "Pedido de apoio inválido" }, { status: 400 });
  }

  const { action, note } = payload;

  const signal = await prisma.careSignal.findUnique({
    where: { id: signalId },
    include: {
      group: {
        include: {
          responsibilities: {
            where: { activeUntil: null },
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      assignedTo: true,
    },
  });

  if (!signal || signal.churchId !== user.churchId || signal.status !== SignalStatus.OPEN) {
    return NextResponse.json({ error: "Sinal não encontrado" }, { status: 404 });
  }

  if (!canViewGroup(user, signal.group)) {
    return NextResponse.json({ error: "Sem permissão para este cuidado" }, { status: 403 });
  }

  if (action === "REQUEST_SUPERVISOR") {
    if (!canRequestSupervisorSupport(user, signal)) {
      return NextResponse.json({ error: "Apenas o líder da célula pode pedir apoio à supervisão" }, { status: 403 });
    }

    const supervisorUserId =
      signal.group?.responsibilities.find((responsibility) => responsibility.role === GroupResponsibilityRole.SUPERVISOR)?.userId
      ?? signal.group?.supervisorUserId;

    if (!supervisorUserId) {
      return NextResponse.json({ error: "Esta célula ainda não tem supervisor definido" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedSignal = await tx.careSignal.update({
        where: { id: signal.id },
        data: { assignedToId: supervisorUserId },
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

    return NextResponse.json({
      ok: true,
      assignedToId: updated.assignedToId,
      assignedToName: updated.assignedTo?.name,
      message: "Apoio solicitado à supervisão.",
    });
  }

  if (!canEscalateSignalToPastor(user, signal)) {
    return NextResponse.json({ error: "Apenas liderança ou supervisão da célula pode encaminhar este caso ao pastor" }, { status: 403 });
  }

  const pastoralAssignee = await findPastoralAssignee(user.churchId);

  if (!pastoralAssignee) {
    return NextResponse.json({ error: "Nenhum pastor/admin disponível para encaminhamento pastoral" }, { status: 400 });
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

  return NextResponse.json({
    ok: true,
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name,
    message: "Encaminhado ao pastor.",
  });
}
