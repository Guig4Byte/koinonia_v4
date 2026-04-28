import { endOfWeek, startOfWeek } from "date-fns";
import { AttendanceStatus, SignalSeverity, SignalStatus, UserRole } from "../../generated/prisma/client";
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
      take: 6,
    }),
    prisma.smallGroup.findMany({
      where: { churchId, isActive: true },
      include: { leader: true, supervisor: true, signals: { where: { status: SignalStatus.OPEN } }, events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  const completedEvents = events.filter((event) => event.status === "COMPLETED" || event.attendances.length > 0);
  const presence = summarizePresence(completedEvents);
  const urgentSignals = openSignals.filter((signal) => signal.severity === SignalSeverity.URGENT).length;

  const groupsWithPresence = groups.map((group) => ({
    id: group.id,
    name: group.name,
    leaderName: group.leader?.name ?? "Sem líder",
    supervisorName: group.supervisor?.name ?? "Sem supervisor",
    presenceRate: summarizePresence(group.events).presenceRate,
    attentionCount: group.signals.length,
  }));

  return {
    plannedEvents: events.length,
    completedEvents: completedEvents.length,
    presenceRate: presence.presenceRate,
    visitors: presence.visitors,
    openSignals,
    urgentSignals,
    groups: groupsWithPresence,
  };
}

async function getGroupScopedDashboard(user: { id: string; churchId: string }, groupWhere: { leaderUserId?: string; supervisorUserId?: string }) {
  const groups = await prisma.smallGroup.findMany({
    where: { churchId: user.churchId, isActive: true, ...groupWhere },
    include: {
      leader: true,
      supervisor: true,
      memberships: { where: { leftAt: null }, include: { person: true } },
      signals: { where: { status: SignalStatus.OPEN }, include: { person: true } },
      events: { orderBy: { startsAt: "desc" }, take: 4, include: { attendances: true } },
    },
    orderBy: { name: "asc" },
  });

  const events = groups.flatMap((group) => group.events);
  const signals = groups.flatMap((group) => group.signals.map((signal) => ({ ...signal, group })));
  const presence = summarizePresence(events);
  const groupsWithPresence = groups.map((group) => ({
    ...group,
    presenceRate: summarizePresence(group.events).presenceRate,
  }));

  return {
    groups: groupsWithPresence,
    events,
    signals,
    presenceRate: presence.presenceRate,
    visitors: presence.visitors,
  };
}

export function getSupervisorDashboard(user: { id: string; churchId: string }) {
  return getGroupScopedDashboard(user, { supervisorUserId: user.id });
}

export function getLeaderDashboard(user: { id: string; churchId: string }) {
  return getGroupScopedDashboard(user, { leaderUserId: user.id });
}

export async function getScopedDashboard(user: { id: string; churchId: string; role: UserRole }) {
  if (user.role === UserRole.PASTOR || user.role === UserRole.ADMIN) {
    return getPastorDashboard(user.churchId);
  }

  if (user.role === UserRole.SUPERVISOR) {
    return getSupervisorDashboard(user);
  }

  return getLeaderDashboard(user);
}
