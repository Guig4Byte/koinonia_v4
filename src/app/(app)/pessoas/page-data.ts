import { redirect } from "next/navigation";
import { MembershipRole, UserRole } from "@/generated/prisma/client";
import {
  getVisibleMembershipWhere,
  getVisibleOpenSignalWhere,
  getVisiblePersonWhere,
  type PermissionUser,
} from "@/features/permissions/permissions";
import { membersFilterHref, readMembersFilter } from "@/features/people/member-filters";
import { IN_CARE_STATUS } from "@/features/people/person-status";
import {
  PEOPLE_PAGE_ATTENTION_SIGNAL_QUERY_LIMIT,
  PEOPLE_PAGE_IN_CARE_QUERY_LIMIT,
  PEOPLE_PAGE_PRIMARY_MEMBERSHIP_LIMIT,
  PEOPLE_PAGE_VISIBLE_MEMBER_QUERY_LIMIT,
  buildPeoplePageView,
} from "@/features/people/people-page-view";
import { splitPastoralSections } from "@/features/signals/sections";
import { prisma } from "@/lib/prisma";
import { firstParam } from "@/lib/search-params";
import { ROUTES } from "@/lib/routes";

type PeoplePageSearchParams = Record<string, string | string[] | undefined>;

export async function getPeoplePageData(user: PermissionUser, queryParams: PeoplePageSearchParams) {
  const activeMembersFilter = readMembersFilter(firstParam(queryParams.membros));

  if (user.role === UserRole.LEADER) {
    redirect(membersFilterHref(ROUTES.cells, activeMembersFilter));
  }

  if (user.role === UserRole.SUPERVISOR) {
    redirect(ROUTES.cells);
  }

  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    redirect(ROUTES.team);
  }

  const memberMembershipWhere = {
    ...getVisibleMembershipWhere(user),
    role: { not: MembershipRole.VISITOR },
  };

  const [openSignals, visibleMembers, inCarePeople] = await Promise.all([
    prisma.careSignal.findMany({
      where: getVisibleOpenSignalWhere(user),
      include: { person: true, assignedTo: true, group: true },
      orderBy: { detectedAt: "desc" },
      take: PEOPLE_PAGE_ATTENTION_SIGNAL_QUERY_LIMIT,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: PEOPLE_PAGE_PRIMARY_MEMBERSHIP_LIMIT,
        },
      },
      orderBy: { fullName: "asc" },
      take: PEOPLE_PAGE_VISIBLE_MEMBER_QUERY_LIMIT,
    }),
    prisma.person.findMany({
      where: {
        AND: [
          getVisiblePersonWhere(user),
          { status: IN_CARE_STATUS },
          { memberships: { some: memberMembershipWhere } },
        ],
      },
      include: {
        memberships: {
          where: memberMembershipWhere,
          include: { group: true },
          take: PEOPLE_PAGE_PRIMARY_MEMBERSHIP_LIMIT,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: PEOPLE_PAGE_IN_CARE_QUERY_LIMIT,
    }),
  ]);

  const pastoralSections = splitPastoralSections({
    signals: openSignals,
    inCarePeople,
    viewer: user,
  });
  const attentionPeople = [
    ...pastoralSections.urgentOrPastoralCases,
    ...pastoralSections.supportRequests,
    ...pastoralSections.localAttention,
  ];
  const peopleView = buildPeoplePageView({
    people: visibleMembers,
    attentionSignals: attentionPeople,
    inCarePeople: pastoralSections.inCarePeople,
    activeFilter: activeMembersFilter,
    viewer: user,
  });

  return {
    activeMembersFilter,
    peopleView,
  };
}
