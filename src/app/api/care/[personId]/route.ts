import { NextRequest, NextResponse } from "next/server";
import { PersonStatus, SignalStatus } from "@/generated/prisma/client";
import { parseCarePayload, resolvedAttentionMessage } from "@/features/care/care-validation";
import { canRegisterCare, getPrimaryVisibleGroupIdForPerson, hasWholeChurchScope } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parseCarePayload(await readJsonBody(request));

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
    let personStatusChangedToCare = false;

    if (body.resolveOpenSignals) {
      const updateResult = await tx.careSignal.updateMany({
        where: {
          churchId: user.churchId,
          personId,
          status: SignalStatus.OPEN,
          ...(hasWholeChurchScope(user) ? {} : { groupId: visibleGroupId }),
        },
        data: { status: SignalStatus.RESOLVED, resolvedAt: new Date() },
      });

      resolvedSignalsCount = updateResult.count;

      const remainingOpenSignals = await tx.careSignal.count({
        where: { churchId: user.churchId, personId, status: SignalStatus.OPEN },
      });

      if (remainingOpenSignals === 0) {
        const personUpdate = await tx.person.updateMany({
          where: {
            id: personId,
            churchId: user.churchId,
            status: { in: [PersonStatus.ACTIVE, PersonStatus.NEW, PersonStatus.NEEDS_ATTENTION, PersonStatus.COOLING_AWAY] },
          },
          data: { status: PersonStatus.COOLING_AWAY },
        });

        personStatusChangedToCare = personUpdate.count > 0;
      }
    }

    return { careTouchId: careTouch.id, resolvedSignalsCount, personStatusChangedToCare };
  });

  return NextResponse.json({
    ok: true,
    careTouchId: result.careTouchId,
    resolvedSignalsCount: result.resolvedSignalsCount,
    personStatusChangedToCare: result.personStatusChangedToCare,
    message: resolvedAttentionMessage(result.resolvedSignalsCount, result.personStatusChangedToCare),
  });
}
