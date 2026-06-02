import { NextRequest } from "next/server";
import { groupNameOrFallback } from "@/features/groups/group-display";
import { getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import {
  SEARCH_ACCENT_FALLBACK_SCAN_LIMIT,
  SEARCH_PRIMARY_MEMBERSHIP_LIMIT,
  SEARCH_RESULT_LIMIT,
  shouldSearchPeople,
} from "@/features/search/search-view";
import { getPastoralSectionSignalsByPerson } from "@/features/signals/sections";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiJson } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { matchesNormalizedQuery, normalizeSearchText } from "@/lib/text";


export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (!shouldSearchPeople(q)) {
    return apiJson({ people: [] });
  }

  const normalizedQuery = normalizeSearchText(q);
  const includeVisibleContext = {
    memberships: { where: getVisibleMembershipWhere(user), include: { group: true }, take: SEARCH_PRIMARY_MEMBERSHIP_LIMIT },
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
    const remainingResultLimit = SEARCH_RESULT_LIMIT - directMatches.length;

    const accentFallbackCandidates = await prisma.person.findMany({
      where: {
        ...getVisiblePersonWhere(user),
        id: { notIn: [...directMatchIds] },
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: SEARCH_ACCENT_FALLBACK_SCAN_LIMIT,
    });

    const accentFallbackIds = accentFallbackCandidates
      .filter((person) => matchesNormalizedQuery(person.fullName, normalizedQuery))
      .slice(0, remainingResultLimit)
      .map((person) => person.id);

    const accentFallbackMatches = accentFallbackIds.length
      ? await prisma.person.findMany({
          where: { id: { in: accentFallbackIds } },
          include: includeVisibleContext,
          orderBy: { fullName: "asc" },
        })
      : [];

    matchingPeople = [...directMatches, ...accentFallbackMatches];
  }

  return apiJson({
    people: matchingPeople.map((person) => {
      const primarySignal = getPastoralSectionSignalsByPerson(person.signals, user)[0];
      const badge = personEffectiveBadgeForViewer(person, primarySignal, user);

      return {
        id: person.id,
        fullName: person.fullName,
        context: groupNameOrFallback(person.memberships[0]?.group),
        status: badge.label,
        statusTone: badge.tone,
      };
    }),
  });
}
