import { NextRequest, NextResponse } from "next/server";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/prisma";

const SEARCH_RESULT_LIMIT = 8;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ people: [] });
  }

  const normalizedQuery = normalizeSearch(q);
  const includeVisibleContext = {
    memberships: { where: getVisibleMembershipWhere(user), include: { group: true }, take: 1 },
    signals: {
      where: getVisibleOpenSignalWhere(user),
      include: { assignedTo: true },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    },
  } satisfies Prisma.PersonInclude;

  const directMatches = await prisma.person.findMany({
    where: {
      ...getVisiblePersonWhere(user),
      fullName: { contains: q, mode: "insensitive" },
    },
    include: includeVisibleContext,
    orderBy: { fullName: "asc" },
    take: SEARCH_RESULT_LIMIT,
  });

  let matchingPeople = directMatches;

  if (matchingPeople.length < SEARCH_RESULT_LIMIT) {
    const directMatchIds = new Set(directMatches.map((person) => person.id));
    const accentFallbackMatches = await prisma.person.findMany({
      where: {
        ...getVisiblePersonWhere(user),
        id: { notIn: [...directMatchIds] },
      },
      include: includeVisibleContext,
      orderBy: { fullName: "asc" },
    });

    matchingPeople = [
      ...directMatches,
      ...accentFallbackMatches.filter((person) => normalizeSearch(person.fullName).includes(normalizedQuery)),
    ].slice(0, SEARCH_RESULT_LIMIT);
  }

  return NextResponse.json({
    people: matchingPeople.map((person) => {
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
