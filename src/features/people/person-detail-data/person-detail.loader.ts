import { GroupResponsibilityRole } from "@/generated/prisma/client";
import {
  canViewGroup,
  canViewPerson,
  getVisibleCareTouchWhere,
  getVisibleEventWhere,
  getVisibleOpenSignalWhere,
  type PermissionUser,
} from "@/features/permissions/permissions";
import { PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT, PERSON_DETAIL_CARE_TOUCH_HISTORY_LIMIT } from "@/features/people/person-detail-view";
import { isInCarePerson } from "@/features/people/person-status";
import { activeGroupResponsibilitiesInclude } from "@/features/groups/group-query";
import { prisma } from "@/lib/prisma";

export type PersonDetailViewer = PermissionUser & {
  name: string;
};

export async function loadPersonDetailContext(user: PersonDetailViewer, personId: string) {
  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: {
      memberships: {
        where: { leftAt: null },
        include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      },
      user: {
        include: {
          groupResponsibilities: {
            where: {
              activeUntil: null,
              role: { in: [GroupResponsibilityRole.LEADER, GroupResponsibilityRole.SUPERVISOR] },
              group: { is: { isActive: true } },
            },
            include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!person || person.churchId !== user.churchId || !canViewPerson(user, person)) {
    return null;
  }

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const visibleEventWhere = getVisibleEventWhere(user);
  const visibleCareTouchWhere = getVisibleCareTouchWhere(user, person.id);
  const referenceDate = new Date();
  const recordedEventWhere = {
    ...visibleEventWhere,
    startsAt: { lte: referenceDate },
  };

  const [signals, attendances, careTouches] = await Promise.all([
    isInCarePerson(person)
      ? []
      : prisma.careSignal.findMany({
          where: { ...visibleOpenSignalWhere, personId: person.id },
          include: { assignedTo: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
          orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
        }),
    prisma.attendance.findMany({
      where: { personId: person.id, event: recordedEventWhere },
      include: { event: { include: { group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } } } },
      orderBy: [{ event: { startsAt: "desc" } }, { markedAt: "desc" }],
      take: PERSON_DETAIL_ATTENDANCE_HISTORY_LIMIT,
    }),
    prisma.careTouch.findMany({
      where: visibleCareTouchWhere,
      include: { actor: true, group: { include: { responsibilities: activeGroupResponsibilitiesInclude } } },
      orderBy: { happenedAt: "desc" },
      take: PERSON_DETAIL_CARE_TOUCH_HISTORY_LIMIT,
    }),
  ]);

  const visibleMemberships = person.memberships.filter((membership) => canViewGroup(user, membership.group));

  return {
    user,
    person,
    signals,
    attendances,
    careTouches,
    visibleMemberships,
  };
}

export type PersonDetailContext = NonNullable<Awaited<ReturnType<typeof loadPersonDetailContext>>>;
