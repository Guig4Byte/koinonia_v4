import { NextRequest, NextResponse } from "next/server";
import { PersonStatus } from "../../../generated/prisma/client";
import { getVisiblePersonWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<PersonStatus, string> = {
  ACTIVE: "Ativo",
  VISITOR: "Visitante",
  NEW: "Novo",
  NEEDS_ATTENTION: "Em atenção",
  COOLING_AWAY: "Esfriando",
  INACTIVE: "Inativo",
};

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ people: [] });
  }

  const people = await prisma.person.findMany({
    where: {
      ...getVisiblePersonWhere(user),
      fullName: { contains: q, mode: "insensitive" },
    },
    include: {
      memberships: { include: { group: true }, take: 1 },
    },
    orderBy: { fullName: "asc" },
    take: 8,
  });

  return NextResponse.json({
    people: people.map((person) => ({
      id: person.id,
      fullName: person.fullName,
      context: person.memberships[0]?.group.name ?? "Sem célula",
      status: statusLabels[person.status],
    })),
  });
}
