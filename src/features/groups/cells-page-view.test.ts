import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildCellsPageView,
  cellsFilterContextContent,
  filterCellsPageGroups,
  groupBadge,
  groupDetailHref,
  groupDetailNavigationFocus,
  groupLeadershipName,
  groupSectionKey,
  groupStatusSummary,
  groupSubtitle,
  type SupervisorDashboard,
  type SupervisorGroup,
} from "./cells-page-view";
import { readCellsFilter, visibleCellsFilter } from "./cells-page-filters";

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
    expect(readCellsFilter("atencao")).toBe("atencao");
    expect(readCellsFilter("apoio")).toBe("apoio");
    expect(readCellsFilter("em-cuidado")).toBe("em-cuidado");
    expect(readCellsFilter("presenca")).toBe("presenca");
    expect(readCellsFilter("sem-presenca")).toBe("sem-presenca");
    expect(readCellsFilter("presenca-baixa")).toBe("presenca-baixa");
    expect(readCellsFilter("qualquer-coisa")).toBe("todos");
  });

  it("mapeia filtros internos para chips visíveis", () => {
    expect(visibleCellsFilter("urgentes")).toBe("urgentes");
    expect(visibleCellsFilter("encaminhadas")).toBe("urgentes");
    expect(visibleCellsFilter("sem-presenca")).toBe("presenca");
    expect(visibleCellsFilter("presenca-baixa")).toBe("presenca");
    expect(visibleCellsFilter("em-cuidado")).toBe("em-cuidado");
  });

  it("explica o recorte pastoral da supervisão por filtro", () => {
    expect(cellsFilterContextContent("todos")).toMatchObject({
      title: "Leitura pastoral da supervisão",
    });
    expect(cellsFilterContextContent("atencao")).toMatchObject({
      title: "Atenção",
      tone: "warn",
    });
    expect(cellsFilterContextContent("urgentes")).toMatchObject({
      title: "Cuidado próximo",
      tone: "risk",
    });
    expect(cellsFilterContextContent("presenca")).toMatchObject({
      title: "Presença pede leitura",
      tone: "neutral",
    });
  });

  it("usa responsabilidade ativa para liderança e subtítulo", () => {
    const current = group({ memberships: [{ id: "m1" }, { id: "m2" }] as SupervisorGroup["memberships"] });

    expect(groupLeadershipName(current)).toBe("Bruno");
    expect(groupSubtitle(current)).toBe("Bruno · 2 membros");
  });

  it("filtra por busca e por atenção pastoral", () => {
    const regular = group({ id: "regular", name: "Célula Norte" });
    const attention = group({ id: "attention", name: "Célula Sul", attentionCount: 1 });
    const support = group({ id: "support", name: "Célula Leste", supportRequestsCount: 1, attentionCount: 1 });
    const urgent = group({ id: "urgent", name: "Célula Urgente", signals: [signal({ severity: SignalSeverity.URGENT })], attentionCount: 1 });
    const inCare = group({ id: "in-care", name: "Célula Vale", inCareCount: 1 });
    const lowPresence = group({ id: "low-presence", name: "Célula Oeste", presenceRate: 62 });
    const noPresence = group({ id: "no-presence", name: "Célula Sem Registro", hasPresenceData: false });

    expect(filterCellsPageGroups([regular, attention], "sul", "todos").map((item) => item.id)).toEqual(["attention"]);
    expect(filterCellsPageGroups([regular, attention, support, urgent], "", "atencao").map((item) => item.id)).toEqual(["attention"]);
    expect(filterCellsPageGroups([regular, support], "", "apoio").map((item) => item.id)).toEqual(["support"]);
    expect(filterCellsPageGroups([regular, inCare], "", "em-cuidado").map((item) => item.id)).toEqual(["in-care"]);
    expect(filterCellsPageGroups([regular, lowPresence, noPresence], "", "presenca").map((item) => item.id)).toEqual(["no-presence", "low-presence"]);
    expect(filterCellsPageGroups([regular, lowPresence], "", "presenca-baixa").map((item) => item.id)).toEqual(["low-presence"]);
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
    expect(groupDetailNavigationFocus(group({ inCareCount: 1 }))).toBe("em-cuidado");
    expect(groupDetailNavigationFocus(group({ hasPresenceData: false }))).toBe("sem-presenca");
    expect(groupDetailNavigationFocus(group({ presenceRate: 60 }))).toBe("presenca-baixa");
    expect(groupDetailNavigationFocus(group())).toBeNull();
    expect(groupDetailNavigationFocus(group({ supportRequestsCount: 1, inCareCount: 1 }), "em-cuidado")).toBe("em-cuidado");
    expect(groupDetailNavigationFocus(group({ signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })], attentionCount: 2 }), "atencao")).toBe("atencao");
    expect(groupDetailNavigationFocus(group({ presenceRate: 60 }), "presenca")).toBe("presenca-baixa");

    expect(groupDetailHref(group({ id: "group-care", supportRequestsCount: 1 }))).toBe("/celulas/group-care?foco=apoio");
    expect(groupDetailHref(group({ id: "group-care", supportRequestsCount: 1, inCareCount: 1 }), "em-cuidado")).toBe("/celulas/group-care?foco=em-cuidado");
    expect(groupDetailHref(group({ id: "group-low-presence", presenceRate: 60 }), "presenca")).toBe("/celulas/group-low-presence?foco=presenca-baixa");
    expect(groupDetailHref(group({ id: "group-stable" }))).toBe("/celulas/group-stable");
  });

  it("resolve selo pastoral por prioridade", () => {
    expect(groupBadge(group({ signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })] }))).toEqual({ label: "1 urgente", tone: "risk" });
    expect(groupBadge(group({ signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })], attentionCount: 2 }), "atencao")).toEqual({ label: "1 em atenção", tone: "warn" });
    expect(groupBadge(group({ supportRequestsCount: 2 }))).toEqual({ label: "2 apoios", tone: "support" });
    expect(groupBadge(group({ supportRequestsCount: 1, inCareCount: 2 }), "em-cuidado")).toEqual({ label: "2 em cuidado", tone: "care" });
    expect(groupBadge(group({ inCareCount: 2 }))).toEqual({ label: "2 em cuidado", tone: "care" });
    expect(groupBadge(group({ hasPresenceData: false }))).toEqual({ label: "Sem presença", tone: "neutral" });
    expect(groupBadge(group({ presenceRate: 60 }))).toEqual({ label: "Presença baixa", tone: "warn" });
    expect(groupBadge(group({ signals: [signal({ severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } as SupervisorGroup["signals"][number]["assignedTo"] })] }))).toEqual({ label: "1 encaminhado", tone: "risk" });
  });

  it("resume frentes adicionais sem substituir o status principal", () => {
    const mixedGroup = group({
      signals: [signal({ severity: SignalSeverity.URGENT })],
      attentionCount: 3,
      supportRequestsCount: 1,
    });
    const broadGroup = group({
      signals: [signal({ severity: SignalSeverity.URGENT })],
      attentionCount: 3,
      supportRequestsCount: 1,
      inCareCount: 1,
    });

    expect(groupStatusSummary(group({ signals: [signal({ severity: SignalSeverity.URGENT })] }))).toBeUndefined();
    expect(groupStatusSummary(mixedGroup)).toBe("Também há apoio e atenção");
    expect(groupStatusSummary(mixedGroup, "atencao")).toBe("Também há urgência e apoio");
    expect(groupStatusSummary(broadGroup)).toBe("Também há apoio, atenção e cuidado no radar");
  });

  it("monta visão da página com contadores e indicador de navegação", () => {
    const risky = group({ id: "risk", signals: [signal({ severity: SignalSeverity.URGENT, assignedTo: null })] });
    const noPresence = group({ id: "no-presence", hasPresenceData: false });
    const view = buildCellsPageView({ dashboard: dashboard([risky, noPresence]), query: "", normalizedQuery: "", filter: "todos" });

    expect(view.groups).toHaveLength(2);
    expect(view.groupedSections.map((section) => section.key)).toEqual(["care", "presence"]);
    expect(view.groupedSections[0].detail).toBe("Sinais abertos, pedidos de apoio ou irmãos já em cuidado.");
    expect(view.groupsNeedingAttentionCount).toBe(1);
    expect(view.groupsWithoutPresenceCount).toBe(1);
    expect(view.navIndicator).toBe("risk");
    expect(view.isFiltered).toBe(false);
  });
});
