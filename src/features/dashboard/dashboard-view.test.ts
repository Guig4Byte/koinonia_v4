import { describe, expect, it } from "vitest";
import { AttendanceStatus, GroupResponsibilityRole, PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildPastorTeamGroup,
  buildScopedGroupDashboardItem,
  buildSupervisorTeam,
  comparePastoralPriorityThenName,
  mergeGroupsById,
  mergeSupervisorTeamsBySharedGroups,
  type DashboardEvent,
} from "./dashboard-view";
import type { PermissionUser } from "@/features/permissions/permissions";

const now = new Date("2026-05-08T12:00:00.000Z");

function signal(overrides: Partial<Parameters<typeof buildPastorTeamGroup>[0]["signals"][number]> = {}) {
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
        group({ id: "group-2", memberships: [{ person: { status: PersonStatus.ACTIVE } }] }),
      ],
    });

    expect(team.groups).toHaveLength(2);
    expect(team.groupsNeedingAttentionCount).toBe(1);
    expect(team.urgentCount).toBe(1);
    expect(team.pastoralCasesCount).toBe(1);
  });

  it("mantém célula nova sem histórico como estável", () => {
    const team = buildSupervisorTeam({
      supervisor: { id: "sup-1", name: "Ana", email: "ana@igreja.com" },
      groups: [group({ events: [], memberships: [{ person: { status: PersonStatus.ACTIVE } }] })],
    });

    expect(team.groups[0]?.hasPresenceData).toBe(false);
    expect(team.groups[0]?.recordedEventsCount).toBe(0);
    expect(team.groups[0]?.hasNoPresenceData).toBe(false);
    expect(team.groups[0]?.pastoralPriorityScore).toBe(0);
    expect(team.groups[0]?.statusLabel).toBe("Estável");
    expect(team.groupsNeedingAttentionCount).toBe(0);
  });

  it("mantém retomar contato apenas quando já houve histórico de encontro", () => {
    const team = buildSupervisorTeam({
      supervisor: { id: "sup-1", name: "Ana", email: "ana@igreja.com" },
      groups: [group({ events: [event("COMPLETED", now, [])], memberships: [{ person: { status: PersonStatus.ACTIVE } }] })],
    });

    expect(team.groups[0]?.hasPresenceData).toBe(false);
    expect(team.groups[0]?.recordedEventsCount).toBe(1);
    expect(team.groups[0]?.hasNoPresenceData).toBe(true);
    expect(team.groups[0]?.pastoralPriorityScore).toBeGreaterThan(0);
    expect(team.groups[0]?.statusLabel).toBe("Retomar contato");
    expect(team.groupsNeedingAttentionCount).toBe(0);
  });

  it("agrupa supervisores que acompanham exatamente as mesmas células", () => {
    const fernando = buildSupervisorTeam({
      supervisor: { id: "sup-1", name: "Fernando Cidade", email: "fernando.cidade@koinonia.local" },
      groups: [group({ id: "semear", name: "Célula Semear" })],
    });
    const cibeli = buildSupervisorTeam({
      supervisor: { id: "sup-2", name: "Cibeli", email: "cibeli@koinonia.local" },
      groups: [group({ id: "semear", name: "Célula Semear" })],
    });

    const mergedTeams = mergeSupervisorTeamsBySharedGroups([fernando, cibeli]);

    expect(mergedTeams).toHaveLength(1);
    expect(mergedTeams[0]?.name).toBe("Fernando Cidade e Cibeli");
    expect(mergedTeams[0]?.groups).toHaveLength(1);
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
