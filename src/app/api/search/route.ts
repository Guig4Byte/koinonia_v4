import { NextRequest } from "next/server";
import { canViewGroup, getVisibleMembershipWhere, getVisibleOpenSignalWhere, getVisiblePersonWhere } from "@/features/permissions/permissions";
import { personDisplayContext, personLeadershipDisplayBadge } from "@/features/people/person-display-context";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import {
  SEARCH_ACCENT_FALLBACK_SCAN_LIMIT,
  SEARCH_PRIMARY_MEMBERSHIP_LIMIT,
  SEARCH_RESULT_LIMIT,
  shouldSearchPeople,
} from "@/features/search/search-view";
import { getPastoralSectionSignalsByPerson } from "@/features/signals/sections";
import { GroupResponsibilityRole, type Prisma } from "@/generated/prisma/client";
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
  const visibleSearchPersonWhere = getVisiblePersonWhere(user);
  const includeVisibleContext = {
    memberships: { where: getVisibleMembershipWhere(user), include: { group: true }, take: SEARCH_PRIMARY_MEMBERSHIP_LIMIT },
    user: {
      select: {
        role: true,
        groupResponsibilities: {
          where: {
            churchId: user.churchId,
            activeUntil: null,
            group: { is: { isActive: true } },
          },
          select: {
            role: true,
            group: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    },
    signals: {
      where: getVisibleOpenSignalWhere(user),
      include: { assignedTo: true },
      orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
    },
  } satisfies Prisma.PersonInclude;

  const directMatches = await prisma.person.findMany({
    where: {
      AND: [
        visibleSearchPersonWhere,
        { fullName: { contains: q, mode: "insensitive" } },
      ],
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
        AND: [
          visibleSearchPersonWhere,
          { id: { notIn: [...directMatchIds] } },
        ],
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
      const responsibilities = person.user?.groupResponsibilities ?? [];
      const ledGroups = responsibilities
        .filter((responsibility) => responsibility.role === GroupResponsibilityRole.LEADER)
        .map((responsibility) => responsibility.group)
        .filter((group) => canViewGroup(user, group));
      const supervisedGroups = responsibilities
        .filter((responsibility) => responsibility.role === GroupResponsibilityRole.SUPERVISOR)
        .map((responsibility) => responsibility.group)
        .filter((group) => canViewGroup(user, group));
      const displayContextInput = {
        status: person.status,
        systemRole: person.user?.role,
        primaryGroup: person.memberships[0]?.group,
        primaryMembershipRole: person.memberships[0]?.role,
        ledGroups,
        supervisedGroups,
        hasSystemAccess: Boolean(person.user),
      };
      const badge = personLeadershipDisplayBadge(displayContextInput)
        ?? personEffectiveBadgeForViewer(person, primarySignal, user);

      return {
        id: person.id,
        fullName: person.fullName,
        context: personDisplayContext(displayContextInput),
        status: badge.label,
        statusTone: badge.tone,
      };
    }),
  });
}
