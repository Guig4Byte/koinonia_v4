import { NextResponse } from "next/server";
import { PersonStatus, SignalStatus } from "@/generated/prisma/client";
import { canRegisterCare } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { memberships: { where: { leftAt: null }, include: { group: true } } },
  });

  if (!person || person.churchId !== user.churchId) {
    return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });
  }

  if (!canRegisterCare(user, person)) {
    return NextResponse.json({ error: "Sem permissão para atualizar esta pessoa" }, { status: 403 });
  }

  const openSignalsCount = await prisma.careSignal.count({
    where: { churchId: user.churchId, personId, status: SignalStatus.OPEN },
  });

  if (openSignalsCount > 0) {
    return NextResponse.json({ error: "Ainda há motivo de atenção aberto para esta pessoa." }, { status: 409 });
  }

  await prisma.person.updateMany({
    where: { id: personId, churchId: user.churchId, status: PersonStatus.COOLING_AWAY },
    data: { status: PersonStatus.ACTIVE },
  });

  return NextResponse.json({ ok: true, status: PersonStatus.ACTIVE });
}
