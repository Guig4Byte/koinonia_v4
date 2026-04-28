import { endOfWeek, startOfWeek } from "date-fns";
import { AttendanceStatus, MembershipRole, SignalSeverity, SignalStatus, UserRole } from "../../generated/prisma/client";
import { getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { getPrimarySignalsByPerson } from "@/features/signals/attention";
import { prisma } from "@/lib/prisma";
import { percent } from "@/lib/format";

function summarizePresence(events: Array<{ attendances: Array<{ status: AttendanceStatus }> }>) {
  const attendances = events.flatMap((event) => event.attendances);
  const accountable = attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const present = accountable.filter((attendance) => attendance.status === AttendanceStatus.PRESENT).length;
  const visitors = attendances.filter((attendance) => attendance.status === AttendanceStatus.VISITOR).length;

  return {
    presenceRate: percent(present, accountable.length),
    visitors,
  };
}

export async function getPastorDashboard(churchId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [events, openSignals, groups] = await Promise.all([
    prisma.event.findMany({
      where: { churchId, type: "CELL_MEETING", startsAt: { gte: weekStart, lte: weekEnd } },
      include: { attendances: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.careSignal.findMany({
      where: { churchId, status: SignalStatus.OPEN },
      include: { person: true, group: { include: { leader: true, supervisor: true } } },
      orderBy: [{ detectedAt: "desc" }],
      take: 50,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: { leader: true, supervisor: true, signals: { where: { status: SignalStatus.OPEN } }, events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const completedEvents = events.filter((event) => event.status === "COMPLETED" || event.attendances.length > 0);
  const presence = summarizePresence(completedEvents);
  const attentionPeople = getPrimarySignalsByPerson(openSignals);
  const urgentSignals = attentionPeople.filter((signal) => signal.severity === SignalSeverity.URGENT).length;

  const groupsWithPresence = groups.map((group) => {
    const recordedEvents = group.events.filter((event) => event.status === "COMPLETED" || event.attendances.length > 0);

    return {
      id: group.id,
      name: group.name,
      leaderName: group.leader?.name ?? "Sem líder",
      supervisorName: group.supervisor?.name ?? "Sem supervisor",
      presenceRate: summarizePresence(recordedEvents).presenceRate,
      recordedEventsCount: recordedEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
    };
  });

  return {
    plannedEvents: events.length,
    completedEvents: completedEvents.length,
    presenceRate: presence.presenceRate,
    visitors: presence.visitors,
    openSignals,
    attentionPeople,
    urgentSignals,
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
      signals: { where: { status: SignalStatus.OPEN }, include: { person: true } },
      events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
    },
    orderBy: { name: "asc" },
  });

  const events = groups.flatMap((group) => group.events);
  const recordedEvents = events.filter((event) => event.status === "COMPLETED" || event.attendances.length > 0);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const attentionPeople = getPrimarySignalsByPerson(signals);
  const presence = summarizePresence(recordedEvents);
  const groupsWithPresence = groups.map((group) => {
    const recordedGroupEvents = group.events.filter((event) => event.status === "COMPLETED" || event.attendances.length > 0);

    return {
      ...group,
      presenceRate: summarizePresence(recordedGroupEvents).presenceRate,
      recordedEventsCount: recordedGroupEvents.length,
      attentionCount: getPrimarySignalsByPerson(group.signals).length,
    };
  });

  return {
    groups: groupsWithPresence,
    events,
    signals,
    attentionPeople,
    presenceRate: presence.presenceRate,
    recordedEventsCount: recordedEvents.length,
    visitors: presence.visitors,
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
    return getPastorDashboard(user.churchId);
  }

  if (user.role === UserRole.SUPERVISOR) {
    return getSupervisorDashboard(user);
  }

  return getLeaderDashboard(user);
}
