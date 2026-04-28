import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CareKind } from "../../../../generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  kind: z.nativeEnum(CareKind),
  note: z.string().max(500).optional(),
  resolveOpenSignals: z.boolean().default(true),
});

export async function POST(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const body = payloadSchema.parse(await request.json());

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { memberships: { include: { group: true } } },
  });

  if (!person || person.churchId !== user.churchId) {
    return NextResponse.json({ error: "Pessoa não encontrada" }, { status: 404 });
  }

  const hasScope =
    user.role === "PASTOR" ||
    user.role === "ADMIN" ||
    person.memberships.some((membership) => membership.group.leaderUserId === user.id || membership.group.supervisorUserId === user.id);

  if (!hasScope) {
    return NextResponse.json({ error: "Sem permissão para registrar cuidado" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.careTouch.create({
      data: {
        churchId: user.churchId,
        personId,
        actorId: user.id,
        kind: body.kind,
        note: body.note,
        groupId: person.memberships[0]?.groupId,
      },
    });

    if (body.resolveOpenSignals) {
      await tx.careSignal.updateMany({
        where: { churchId: user.churchId, personId, status: "OPEN" },
        data: { status: "RESOLVED", resolvedAt: new Date() },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
