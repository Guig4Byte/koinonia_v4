import { endOfWeek, startOfWeek } from "date-fns";
import { MembershipRole, PersonStatus, SignalSeverity, SignalStatus, UserRole } from "../../generated/prisma/client";
import { summarizeEventsPresence, isPresenceRecordedEvent } from "@/features/events/presence-summary";
import { canUsePastorDashboard, getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPastoralSignalsByPerson, getPrimarySignalsByPerson } from "@/features/signals/attention";
import { isSupportRequest } from "@/features/signals/sections";
import { prisma } from "@/lib/prisma";

const pastoralSignalWhere = {
  OR: [
    { severity: SignalSeverity.URGENT },
    { assignedTo: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } },
  ],
};

export async function getPastorDashboard(user: PermissionUser) {
  if (!canUsePastorDashboard(user)) {
    throw new Error("getPastorDashboard requires pastor or admin scope");
  }

  const churchId = user.churchId;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [events, openSignals, groups, inCarePeople] = await Promise.all([
    prisma.event.findMany({
      where: {
        churchId,
        type: "CELL_MEETING",
        startsAt: { gte: weekStart, lte: weekEnd },
        group: { is: { churchId, isActive: true } },
      },
      include: { attendances: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.careSignal.findMany({
      where: {
        churchId,
        status: SignalStatus.OPEN,
        AND: [
          pastoralSignalWhere,
          { OR: [{ groupId: null }, { group: { is: { churchId, isActive: true } } }] },
        ],
      },
      include: { person: true, assignedTo: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: [{ detectedAt: "desc" }],
      take: 50,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: {
        leader: true,
        supervisor: true,
        signals: { where: { status: SignalStatus.OPEN }, include: { assignedTo: true } },
        events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.person.findMany({
      where: {
        churchId,
        status: PersonStatus.COOLING_AWAY,
        memberships: { some: { leftAt: null, role: { not: MembershipRole.VISITOR }, group: { is: { churchId, isActive: true } } } },
        careTouches: { some: { actor: { is: { role: { in: [UserRole.PASTOR, UserRole.ADMIN] } } } } },
      },
      include: {
        memberships: {
          where: { leftAt: null, role: { not: MembershipRole.VISITOR }, group: { is: { churchId, isActive: true } } },
          include: { group: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
  ]);

  const dueEvents = events.filter((event) => event.startsAt < tomorrow);
  const completedEvents = dueEvents.filter(isPresenceRecordedEvent);
  const pendingGroupIds = new Set(dueEvents
    .filter((event) => event.status !== "COMPLETED" && event.attendances.length === 0 && event.groupId)
    .map((event) => event.groupId));
  const presence = summarizeEventsPresence(completedEvents);
  const attentionPeople = getPastoralSignalsByPerson(openSignals);
  const urgentSignals = attentionPeople.length;

  const groupsWithPresence = groups.map((group) => {
    const groupPresence = summarizeEventsPresence(group.events);
    const recordedEvents = group.events.filter(isPresenceRecordedEvent);

    return {
      id: group.id,
      name: group.name,
      leaderName: group.leader?.name ?? "Sem líder",
      supervisorName: group.supervisor?.name ?? "Sem supervisor",
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      recordedEventsCount: recordedEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
      pastoralCasesCount: getPastoralSignalsByPerson(group.signals).length,
    };
  });

  return {
    plannedEvents: dueEvents.length,
    completedEvents: completedEvents.length,
    pendingGroupsCount: pendingGroupIds.size,
    presenceRate: presence.presenceRate,
    visitors: presence.visitorCount,
    hasPresenceData: presence.hasPresenceData,
    openSignals,
    attentionPeople,
    urgentSignals,
    inCarePeople,
    groups: groupsWithPresence,
  };
}

async function getGroupScopedDashboard(user: PermissionUser) {
  const groups = await prisma.smallGroup.findMany({
    where: getVisibleGroupWhere(user),
    include: {
      leader: true,
      supervisor: true,
      memberships: { where: { leftAt: null, role: { not: MembershipRole.VISITOR } }, include: { person: true } },
      signals: { where: { status: SignalStatus.OPEN }, include: { person: true, assignedTo: true } },
      events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
    },
    orderBy: { name: "asc" },
  });

  const events = groups.flatMap((group) => group.events);
  const recordedEvents = events.filter(isPresenceRecordedEvent);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const attentionPeople = getPrimarySignalsByPerson(signals);
  const supportRequests = attentionPeople.filter((signal) => isSupportRequest(signal, user));
  const delegatedToPastor = signals.filter((signal) => signal.assignedTo?.role === UserRole.PASTOR || signal.assignedTo?.role === UserRole.ADMIN);
  const presence = summarizeEventsPresence(recordedEvents);
  const groupsWithPresence = groups.map((group) => {
    const groupPresence = summarizeEventsPresence(group.events);
    const recordedGroupEvents = group.events.filter(isPresenceRecordedEvent);

    return {
      ...group,
      presenceRate: groupPresence.presenceRate,
      hasPresenceData: groupPresence.hasPresenceData,
      recordedEventsCount: recordedGroupEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
      supportRequestsCount: getPrimarySignalsByPerson(group.signals).filter((signal) => isSupportRequest(signal, user)).length,
      inCareCount: group.memberships.filter((membership) => membership.person.status === PersonStatus.COOLING_AWAY).length,
    };
  });

  return {
    groups: groupsWithPresence,
    events,
    signals,
    attentionPeople,
    supportRequests,
    delegatedToPastor,
    presenceRate: presence.presenceRate,
    hasPresenceData: presence.hasPresenceData,
    recordedEventsCount: recordedEvents.length,
    visitors: presence.visitorCount,
  };
}

export function getSupervisorDashboard(user: PermissionUser) {
  return getGroupScopedDashboard(user);
}

export function getLeaderDashboard(user: PermissionUser) {
  return getGroupScopedDashboard(user);
}

export async function getScopedDashboard(user: PermissionUser) {
  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    return getPastorDashboard(user);
  }

  if (user.role === UserRole.SUPERVISOR) {
    return getSupervisorDashboard(user);
  }

  return getLeaderDashboard(user);
}
