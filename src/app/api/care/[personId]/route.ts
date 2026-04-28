import { NextRequest, NextResponse } from "next/server";
import { parseCarePayload, resolvedAttentionMessage } from "@/features/care/care-validation";
import { canRegisterCare, getPrimaryVisibleGroupIdForPerson, hasWholeChurchScope } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

async function readJson(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parseCarePayload(await readJson(request));

  if (!parsedBody.success) {
    return NextResponse.json({ error: "Dados de cuidado inválidos" }, { status: 400 });
  }

  const body = parsedBody.data;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { memberships: { where: { leftAt: null }, include: { group: true } } },
  });

  if (!person || person.churchId !== user.churchId) {
    return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });
  }

  if (!canRegisterCare(user, person)) {
    return NextResponse.json({ error: "Sem permissão para registrar cuidado" }, { status: 403 });
  }

  const visibleGroupId = getPrimaryVisibleGroupIdForPerson(user, person);

  if (!hasWholeChurchScope(user) && !visibleGroupId) {
    return NextResponse.json({ error: "Sem célula visível para registrar este cuidado" }, { status: 403 });
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

    if (body.resolveOpenSignals) {
      const updateResult = await tx.careSignal.updateMany({
        where: {
          churchId: user.churchId,
          personId,
          status: "OPEN",
          ...(hasWholeChurchScope(user) ? {} : { groupId: visibleGroupId }),
        },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });

      resolvedSignalsCount = updateResult.count;
    }

    return { careTouchId: careTouch.id, resolvedSignalsCount };
  });

  return NextResponse.json({
    ok: true,
    careTouchId: result.careTouchId,
    resolvedSignalsCount: result.resolvedSignalsCount,
    message: resolvedAttentionMessage(result.resolvedSignalsCount),
  });
}
