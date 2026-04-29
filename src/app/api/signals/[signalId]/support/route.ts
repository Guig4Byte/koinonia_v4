import { NextRequest, NextResponse } from "next/server";
import { SignalStatus, UserRole } from "@/generated/prisma/client";
import { canViewGroup } from "@/features/permissions/permissions";
import { canEscalateSignalToPastor, canRequestSupervisorSupport } from "@/features/signals/escalation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

const supportActions = ["REQUEST_SUPERVISOR", "ESCALATE_PASTOR"] as const;
type SupportAction = (typeof supportActions)[number];

const supportActionValues = new Set<string>(supportActions);

function isSupportAction(value: unknown): value is SupportAction {
  return typeof value === "string" && supportActionValues.has(value);
}

function parseAction(input: unknown): SupportAction | null {
  if (typeof input !== "object" || input === null || !("action" in input)) return null;

  const action = input.action;
  return isSupportAction(action) ? action : null;
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
  const action = parseAction(await readJsonBody(request));

  if (!action) {
    return NextResponse.json({ error: "Pedido de apoio inválido" }, { status: 400 });
  }

  const signal = await prisma.careSignal.findUnique({
    where: { id: signalId },
    include: { group: true, assignedTo: true },
  });

  if (!signal || signal.churchId !== user.churchId || signal.status !== SignalStatus.OPEN) {
    return NextResponse.json({ error: "Sinal não encontrado" }, { status: 404 });
  }

  if (!canViewGroup(user, signal.group)) {
    return NextResponse.json({ error: "Sem permissão para este cuidado" }, { status: 403 });
  }

  if (action === "REQUEST_SUPERVISOR") {
    if (user.role === UserRole.LEADER && signal.group?.leaderUserId === user.id && !signal.group?.supervisorUserId) {
      return NextResponse.json({ error: "Esta célula ainda não tem supervisor definido" }, { status: 400 });
    }

    if (!canRequestSupervisorSupport(user, signal)) {
      return NextResponse.json({ error: "Apenas o líder da célula pode pedir apoio à supervisão" }, { status: 403 });
    }

    const supervisorUserId = signal.group?.supervisorUserId;

    if (!supervisorUserId) {
      return NextResponse.json({ error: "Esta célula ainda não tem supervisor definido" }, { status: 400 });
    }

    const updated = await prisma.careSignal.update({
      where: { id: signal.id },
      data: { assignedToId: supervisorUserId },
      include: { assignedTo: true },
    });

    return NextResponse.json({
      ok: true,
      assignedToId: updated.assignedToId,
      assignedToName: updated.assignedTo?.name,
      message: "Apoio solicitado à supervisão.",
    });
  }

  if (!canEscalateSignalToPastor(user, signal)) {
    return NextResponse.json({ error: "Apenas a supervisão da célula pode encaminhar este caso ao pastor" }, { status: 403 });
  }

  const pastoralAssignee = await findPastoralAssignee(user.churchId);

  if (!pastoralAssignee) {
    return NextResponse.json({ error: "Nenhum pastor/admin disponível para encaminhamento pastoral" }, { status: 400 });
  }

  const updated = await prisma.careSignal.update({
    where: { id: signal.id },
    data: { assignedToId: pastoralAssignee.id },
    include: { assignedTo: true },
  });

  return NextResponse.json({
    ok: true,
    assignedToId: updated.assignedToId,
    assignedToName: updated.assignedTo?.name,
    message: "Encaminhado ao pastor.",
  });
}
