import { NextRequest, NextResponse } from "next/server";
import { SignalStatus, UserRole } from "@/generated/prisma/client";
import { canViewGroup } from "@/features/permissions/permissions";
import { canEscalateSignalToPastor, canRequestSupervisorSupport } from "@/features/signals/escalation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

type SupportAction = "REQUEST_SUPERVISOR" | "ESCALATE_PASTOR";

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseAction(input: unknown): SupportAction | null {
  if (!input || typeof input !== "object") return null;
  const action = (input as { action?: unknown }).action;
  if (action === "REQUEST_SUPERVISOR" || action === "ESCALATE_PASTOR") return action;
  return null;
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
  const action = parseAction(await readJson(request));

  if (!action) {
    return NextResponse.json({ error: "Ação de apoio inválida" }, { status: 400 });
  }

  const signal = await prisma.careSignal.findUnique({
    where: { id: signalId },
    include: { group: true, assignedTo: true },
  });

  if (!signal || signal.churchId !== user.churchId || signal.status !== SignalStatus.OPEN) {
    return NextResponse.json({ error: "Sinal não encontrado" }, { status: 404 });
  }

  if (!canViewGroup(user, signal.group)) {
    return NextResponse.json({ error: "Sem permissão para atualizar este sinal" }, { status: 403 });
  }

  if (action === "REQUEST_SUPERVISOR") {
    if (user.role === UserRole.LEADER && signal.group?.leaderUserId === user.id && !signal.group?.supervisorUserId) {
      return NextResponse.json({ error: "Esta célula ainda não tem supervisor definido" }, { status: 400 });
    }

    if (!canRequestSupervisorSupport(user, signal)) {
      return NextResponse.json({ error: "Apenas o líder da célula pode pedir apoio ao supervisor" }, { status: 403 });
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
      message: "Pedido de apoio enviado ao supervisor.",
    });
  }

  if (!canEscalateSignalToPastor(user, signal)) {
    return NextResponse.json({ error: "Apenas o supervisor da célula pode encaminhar este caso ao pastor" }, { status: 403 });
  }

  const pastoralAssignee = await findPastoralAssignee(user.churchId);

  if (!pastoralAssignee) {
    return NextResponse.json({ error: "Nenhum pastor/admin disponível para receber este caso" }, { status: 400 });
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
    message: "Caso encaminhado ao pastor.",
  });
}
