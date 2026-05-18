import { describe, expect, it } from "vitest";
import { AttendanceStatus, GroupResponsibilityRole, PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildPastorGroupPresence,
  buildPastorTeamGroup,
  buildScopedGroupDashboardItem,
  buildSupervisorTeam,
  comparePastoralPriorityThenName,
  mergeGroupsById,
  type DashboardEvent,
} from "./dashboard-view";
import type { PermissionUser } from "@/features/permissions/permissions";

const now = new Date("2026-05-08T12:00:00.000Z");

function signal(overrides: Partial<Parameters<typeof buildPastorGroupPresence>[0]["signals"][number]> = {}) {
  return {
    id: overrides.id ?? `signal-${overrides.personId ?? "person-1"}`,
    personId: overrides.personId ?? "person-1",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    detectedAt: overrides.detectedAt ?? now,
    assignedToId: overrides.assignedToId ?? null,
    assignedTo: overrides.assignedTo ?? null,
  };
}

type DashboardAttendance = DashboardEvent["attendances"][number];

function event(
  status: DashboardEvent["status"] = "COMPLETED",
  startsAt: Date = now,
  attendances: DashboardAttendance[] = [{ status: AttendanceStatus.PRESENT }],
): DashboardEvent {
  return { status, startsAt, attendances };
}

function group(overrides: Partial<Parameters<typeof buildPastorTeamGroup>[0]> = {}) {
  return {
    id: overrides.id ?? "group-1",
    name: overrides.name ?? "Célula Central",
    responsibilities: overrides.responsibilities ?? [
      { role: GroupResponsibilityRole.LEADER, user: { name: "Camila" } },
      { role: GroupResponsibilityRole.SUPERVISOR, user: { name: "Ana" } },
    ],
    signals: overrides.signals ?? [],
    events: overrides.events ?? [event()],
    memberships: overrides.memberships ?? [
      { person: { status: PersonStatus.ACTIVE } },
      { person: { status: PersonStatus.COOLING_AWAY } },
    ],
  };
}

const leaderUser: PermissionUser = {
  id: "leader-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

describe("dashboard-view", () => {
  it("monta resumo pastoral de célula para o pastor", () => {
    const summary = buildPastorGroupPresence(group({
      events: [event("COMPLETED", now, [{ status: AttendanceStatus.PRESENT }, { status: AttendanceStatus.ABSENT }])],
      signals: [
        signal(),
        signal({ id: "signal-person-2", personId: "person-2", severity: SignalSeverity.URGENT }),
        signal({ id: "signal-person-3", personId: "person-3", assignedTo: { role: UserRole.PASTOR } }),
      ],
    }));

    expect(summary.leaderName).toBe("Camila");
    expect(summary.supervisorName).toBe("Ana");
    expect(summary.presenceRate).toBe(50);
    expect(summary.recordedEventsCount).toBe(1);
    expect(summary.attentionCount).toBe(3);
    expect(summary.urgentCount).toBe(1);
    expect(summary.pastoralCasesCount).toBe(1);
  });

  it("monta célula da equipe com contadores e prioridade pastoral", () => {
    const overview = buildPastorTeamGroup(group({
      signals: [
        signal({ severity: SignalSeverity.URGENT }),
        signal({ id: "pastoral", personId: "person-2", assignedTo: { role: UserRole.PASTOR } }),
        signal({ id: "support", personId: "person-3", assignedTo: { role: UserRole.SUPERVISOR } }),
      ],
      events: [event("COMPLETED", now, [{ status: AttendanceStatus.ABSENT }])],
    }));

    expect(overview.leadershipName).toBe("Camila");
    expect(overview.membersCount).toBe(2);
    expect(overview.inCareCount).toBe(1);
    expect(overview.urgentCount).toBe(1);
    expect(overview.pastoralCasesCount).toBe(1);
    expect(overview.supportRequestsCount).toBe(1);
    expect(overview.hasLowPresence).toBe(true);
    expect(overview.pastoralPriorityScore).toBeGreaterThan(0);
  });

  it("deduplica células mantendo a primeira fonte encontrada", () => {
    const firstGroup = group({ id: "shared", name: "Primeiro vínculo" });
    const repeatedGroup = group({ id: "shared", name: "Vínculo repetido" });
    const otherGroup = group({ id: "other" });

    expect(mergeGroupsById([[firstGroup], [repeatedGroup, otherGroup]])).toEqual([firstGroup, otherGroup]);
  });

  it("ordena por prioridade pastoral e depois por nome", () => {
    const items = [
      { name: "Beta", pastoralPriorityScore: 10 },
      { name: "Alfa", pastoralPriorityScore: 10 },
      { name: "Gama", pastoralPriorityScore: 20 },
    ].sort(comparePastoralPriorityThenName);

    expect(items.map((item) => item.name)).toEqual(["Gama", "Alfa", "Beta"]);
  });

  it("monta equipe de supervisor com agregados", () => {
    const team = buildSupervisorTeam({
      supervisor: { id: "sup-1", name: "Ana", email: "ana@igreja.com" },
      groups: [
        group({ id: "group-1", signals: [signal({ severity: SignalSeverity.URGENT }), signal({ id: "pastoral", personId: "person-2", assignedTo: { role: UserRole.PASTOR } })] }),
        group({ id: "group-2" }),
      ],
    });

    expect(team.groups).toHaveLength(2);
    expect(team.groupsNeedingAttentionCount).toBeGreaterThan(0);
    expect(team.urgentCount).toBe(1);
    expect(team.pastoralCasesCount).toBe(1);
  });

  it("monta item de dashboard escopado com tendência e pedidos de apoio", () => {
    const recentAttendances = [{ status: AttendanceStatus.PRESENT }, { status: AttendanceStatus.PRESENT }, { status: AttendanceStatus.PRESENT }];
    const previousAttendances = [{ status: AttendanceStatus.ABSENT }, { status: AttendanceStatus.ABSENT }, { status: AttendanceStatus.ABSENT }];
    const item = buildScopedGroupDashboardItem(group({
      signals: [signal({ assignedToId: "sup-1", assignedTo: { role: UserRole.SUPERVISOR } })],
      events: [
        event("COMPLETED", now, recentAttendances),
        event("COMPLETED", new Date("2026-05-07T12:00:00.000Z"), recentAttendances),
        event("COMPLETED", new Date("2026-05-06T12:00:00.000Z"), recentAttendances),
        event("COMPLETED", new Date("2026-05-05T12:00:00.000Z"), recentAttendances),
        event("COMPLETED", new Date("2026-05-01T12:00:00.000Z"), previousAttendances),
      ],
    }), leaderUser, now);

    expect(item.hasPresenceData).toBe(true);
    expect(item.recordedEventsCount).toBe(5);
    expect(item.supportRequestsCount).toBe(1);
    expect(item.presenceTrend).toEqual({ direction: "up", delta: 100 });
  });
});
