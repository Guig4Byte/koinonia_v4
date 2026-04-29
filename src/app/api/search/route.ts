import { NextRequest, NextResponse } from "next/server";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

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
      memberships: { where: getVisibleMembershipWhere(user), include: { group: true }, take: 1 },
      signals: {
        where: getVisibleOpenSignalWhere(user),
        include: { assignedTo: true },
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
      },
    },
    orderBy: { fullName: "asc" },
    take: 8,
  });

  return NextResponse.json({
    people: people.map((person) => {
      const primarySignal = getPrimarySignalsByPerson(person.signals)[0];
      const badge = personEffectiveBadgeForViewer(person, primarySignal, user);

      return {
        id: person.id,
        fullName: person.fullName,
        context: person.memberships[0]?.group.name ?? "Sem célula",
        status: badge.label,
        statusTone: badge.tone,
      };
    }),
  });
}
