import {
  canViewGroup,
  getVisibleMembershipWhere,
  getVisibleOpenSignalWhere,
  getVisiblePersonWhere,
  type PermissionUser,
} from "@/features/permissions/permissions";
import { personDisplayContext, personLeadershipDisplayBadge } from "@/features/people/person-display-context";
import { personEffectiveBadgeForViewer } from "@/features/people/status-display";
import { getPastoralSectionSignalsByPerson } from "@/features/signals/sections";
import type { BadgeTone } from "@/components/ui/badge";
import { GroupResponsibilityRole, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { matchesNormalizedQuery, normalizeSearchText } from "@/lib/text";
import {
  SEARCH_ACCENT_FALLBACK_SCAN_LIMIT,
  SEARCH_PRIMARY_MEMBERSHIP_LIMIT,
  SEARCH_RESULT_LIMIT,
  normalizeSearchQuery,
  shouldSearchPeople,
} from "./search-view";

export type PeopleSearchResult = {
  id: string;
  fullName: string;
  context: string;
  status: string;
  statusTone?: BadgeTone;
};

function visibleSearchPersonInclude(user: PermissionUser) {
  return {
    memberships: {
      where: getVisibleMembershipWhere(user),
      include: { group: true },
      take: SEARCH_PRIMARY_MEMBERSHIP_LIMIT,
    },
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
}

type SearchPersonWithVisibleContext = Prisma.PersonGetPayload<{
  include: ReturnType<typeof visibleSearchPersonInclude>;
}>;

function searchPersonToResult(person: SearchPersonWithVisibleContext, user: PermissionUser): PeopleSearchResult {
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
}

async function findVisiblePeopleByName(user: PermissionUser, query: string): Promise<SearchPersonWithVisibleContext[]> {
  const visibleSearchPersonWhere = getVisiblePersonWhere(user);
  const includeVisibleContext = visibleSearchPersonInclude(user);

  const directMatches = await prisma.person.findMany({
    where: {
      AND: [
        visibleSearchPersonWhere,
        { fullName: { contains: query, mode: "insensitive" } },
      ],
    },
    include: includeVisibleContext,
    orderBy: { fullName: "asc" },
    take: SEARCH_RESULT_LIMIT,
  });

  if (directMatches.length >= SEARCH_RESULT_LIMIT) {
    return directMatches;
  }

  const directMatchIds = new Set(directMatches.map((person) => person.id));
  const remainingResultLimit = SEARCH_RESULT_LIMIT - directMatches.length;
  const normalizedQuery = normalizeSearchText(query);

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

  if (accentFallbackIds.length === 0) return directMatches;

  const accentFallbackMatches = await prisma.person.findMany({
    where: { id: { in: accentFallbackIds } },
    include: includeVisibleContext,
    orderBy: { fullName: "asc" },
  });

  return [...directMatches, ...accentFallbackMatches];
}

export async function searchVisiblePeople(user: PermissionUser, query: string): Promise<PeopleSearchResult[]> {
  const normalizedQuery = normalizeSearchQuery(query);

  if (!shouldSearchPeople(normalizedQuery)) return [];

  const matchingPeople = await findVisiblePeopleByName(user, normalizedQuery);
  return matchingPeople.map((person) => searchPersonToResult(person, user));
}
