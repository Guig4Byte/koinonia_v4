import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildCellsPageView,
  filterCellsPageGroups,
  groupBadge,
  groupDetailHref,
  groupDetailNavigationFocus,
  groupLeadershipName,
  groupSectionKey,
  groupSubtitle,
  type SupervisorDashboard,
  type SupervisorGroup,
} from "./cells-page-view";
import { readCellsFilter } from "./cells-page-filters";

function group(overrides: Partial<SupervisorGroup> = {}): SupervisorGroup {
  return {
    id: "group-1",
    name: "Célula Central",
    leader: null,
    responsibilities: [
      {
        role: GroupResponsibilityRole.LEADER,
        user: { name: "Bruno" },
      },
    ],
    memberships: [{ id: "membership-1" }],
    presenceRate: 90,
    presenceTrend: null,
    hasPresenceData: true,
    attentionCount: 0,
    supportRequestsCount: 0,
    inCareCount: 0,
    signals: [],
    ...overrides,
  } as SupervisorGroup;
}

function dashboard(groups: SupervisorGroup[]): SupervisorDashboard {
  return {
    groups,
    attentionPeople: [],
    weeklyPresence: {
      hasPresenceData: true,
      presenceRate: 80,
      recordedEventsCount: 1,
    },
  } as unknown as SupervisorDashboard;
}

function signal(overrides: Partial<SupervisorGroup["signals"][number]> = {}): SupervisorGroup["signals"][number] {
  return {
    id: "signal-1",
    churchId: "church-1",
    personId: "person-1",
    groupId: "group-1",
    type: "ATTENDANCE",
    severity: SignalSeverity.ATTENTION,
    status: "OPEN",
    title: "Sinal de presença",
    detail: null,
    evidence: null,
    assignedToId: null,
    createdAt: new Date("2026-05-01T00:00:00Z"),
    updatedAt: new Date("2026-05-01T00:00:00Z"),
    resolvedAt: null,
    resolvedById: null,
    person: {
      id: "person-1",
      churchId: "church-1",
      fullName: "João",
      phone: null,
      avatarUrl: null,
      shortNote: null,
      status: "ACTIVE",
      createdAt: new Date("2026-05-01T00:00:00Z"),
      updatedAt: new Date("2026-05-01T00:00:00Z"),
    },
    assignedTo: null,
    ...overrides,
  } as SupervisorGroup["signals"][number];
}

describe("cells-page-view", () => {
  it("normaliza filtro inválido para todos", () => {
    expect(readCellsFilter("sem-presenca")).toBe("sem-presenca");
    expect(readCellsFilter("qualquer-coisa")).toBe("todos");
  });

  it("usa responsabilidade ativa para liderança e subtítulo", () => {
    const current = group({ memberships: [{ id: "m1" }, { id: "m2" }] as SupervisorGroup["memberships"] });

    expect(groupLeadershipName(current)).toBe("Bruno");
    expect(groupSubtitle(current)).toBe("Bruno · 2 membros");
  });

  it("filtra por busca e por atenção pastoral", () => {
    const regular = group({ id: "regular", name: "Célula Norte" });
    const attention = group({ id: "attention", name: "Célula Sul", attentionCount: 1 });

    expect(filterCellsPageGroups([regular, attention], "sul", "todos").map((item) => item.id)).toEqual(["attention"]);
    expect(filterCellsPageGroups([regular, attention], "", "atencao").map((item) => item.id)).toEqual(["attention"]);
  });

  it("separa células por cuidado, presença e estabilidade", () => {
    expect(groupSectionKey(group({ supportRequestsCount: 1 }))).toBe("care");
    expect(groupSectionKey(group({ hasPresenceData: false }))).toBe("presence");
    expect(groupSectionKey(group())).toBe("stable");
  });


  it("abre o detalhe da célula já no recorte pastoral mais relevante", () => {
    expect(groupDetailNavigationFocus(group({ signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })] }))).toBe("urgentes");
    expect(groupDetailNavigationFocus(group({ signals: [signal({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } as SupervisorGroup["signals"][number]["assignedTo"] })] }))).toBe("encaminhadas");
    expect(groupDetailNavigationFocus(group({ supportRequestsCount: 1 }))).toBe("apoio");
    expect(groupDetailNavigationFocus(group({ attentionCount: 1 }))).toBe("atencao");
    expect(groupDetailNavigationFocus(group({ inCareCount: 1 }))).toBe("atencao");
    expect(groupDetailNavigationFocus(group({ hasPresenceData: false }))).toBe("sem-presenca");
    expect(groupDetailNavigationFocus(group())).toBeNull();

    expect(groupDetailHref(group({ id: "group-care", supportRequestsCount: 1 }))).toBe("/celulas/group-care?foco=apoio");
    expect(groupDetailHref(group({ id: "group-stable" }))).toBe("/celulas/group-stable");
  });

  it("resolve selo pastoral por prioridade", () => {
    expect(groupBadge(group({ signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })] }))).toEqual({ label: "1 urgente", tone: "risk" });
    expect(groupBadge(group({ supportRequestsCount: 2 }))).toEqual({ label: "2 pedidos de apoio", tone: "support" });
    expect(groupBadge(group({ hasPresenceData: false }))).toEqual({ label: "Sem presença recente", tone: "neutral" });
    expect(groupBadge(group({ presenceRate: 60 }))).toEqual({ label: "Presença baixa", tone: "warn" });
    expect(groupBadge(group({ signals: [signal({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } as SupervisorGroup["signals"][number]["assignedTo"] })] }))).toEqual({ label: "1 encaminhado", tone: "risk" });
  });

  it("monta visão da página com contadores e indicador de navegação", () => {
    const risky = group({ id: "risk", signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })] });
    const noPresence = group({ id: "no-presence", hasPresenceData: false });
    const view = buildCellsPageView({ dashboard: dashboard([risky, noPresence]), query: "", normalizedQuery: "", filter: "todos" });

    expect(view.groups).toHaveLength(2);
    expect(view.groupedSections.map((section) => section.key)).toEqual(["care", "presence"]);
    expect(view.groupedSections[0].detail).toBe("Sinais abertos, pedidos de apoio ou pessoas já em cuidado.");
    expect(view.groupsNeedingAttentionCount).toBe(1);
    expect(view.groupsWithoutPresenceCount).toBe(1);
    expect(view.navIndicator).toBe("risk");
    expect(view.isFiltered).toBe(false);
  });
});
