import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole, PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import type { SupervisorGroup } from "@/features/groups/cells-page-view";
import {
  buildSupervisorPageView,
  type SupervisorPageDashboard,
  type SupervisorPageSignal,
} from "./supervisor-page-view";

const user = { id: "supervisor-1", role: UserRole.SUPERVISOR };

function signal(overrides: Partial<SupervisorPageSignal> = {}): SupervisorPageSignal {
  return {
    id: overrides.id ?? "signal-1",
    personId: overrides.personId ?? "person-1",
    reason: overrides.reason ?? "Ausência recente",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    assignedToId: overrides.assignedToId,
    assignedTo: overrides.assignedTo,
    person: overrides.person ?? { id: overrides.personId ?? "person-1", fullName: "Maria" },
    group: overrides.group ?? { name: "Célula Central" },
    detectedAt: overrides.detectedAt,
  };
}

function group(overrides: Partial<SupervisorGroup> = {}): SupervisorGroup {
  return {
    id: "group-1",
    name: "Célula Central",
    responsibilities: [
      {
        role: GroupResponsibilityRole.LEADER,
        user: { name: "Bruno" },
      },
    ],
    memberships: [
      { person: { id: "p1", fullName: "Ana", status: PersonStatus.ACTIVE } },
    ],
    signals: [],
    presenceRate: 90,
    presenceTrend: null,
    hasPresenceData: true,
    attentionCount: 0,
    supportRequestsCount: 0,
    inCareCount: 0,
    ...overrides,
  } as SupervisorGroup;
}

function dashboard(overrides: Partial<SupervisorPageDashboard> = {}): SupervisorPageDashboard {
  return {
    attentionPeople: overrides.attentionPeople ?? [],
    groups: overrides.groups ?? [],
  };
}

describe("supervisor-page-view", () => {
  it("separa urgentes, apoio com líderes e atenção local", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        attentionPeople: [
          signal({ id: "urgent", personId: "p1", severity: SignalSeverity.URGENT }),
          signal({ id: "support", personId: "p2", assignedToId: user.id }),
          signal({ id: "attention", personId: "p3" }),
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBe("risk");
    expect(view.urgentSignals.map((item) => item.id)).toEqual(["urgent"]);
    expect(view.supportSignals.map((item) => item.id)).toEqual(["support"]);
    expect(view.attentionSignals.map((item) => item.id)).toEqual(["attention"]);
  });

  it("monta pessoas em cuidado a partir dos grupos supervisionados", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({
            name: "Célula Central",
            inCareCount: 1,
            memberships: [
              { person: { id: "p1", fullName: "Ana", status: PersonStatus.COOLING_AWAY } },
              { person: { id: "p2", fullName: "Bruno", status: PersonStatus.ACTIVE } },
            ] as SupervisorGroup["memberships"],
          }),
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBe("care");
    expect(view.inCarePeople).toEqual([{ id: "p1", fullName: "Ana", status: PersonStatus.COOLING_AWAY, groupName: "Célula Central" }]);
    expect(view.focusItems.map((item) => item.key)).toEqual(["care"]);
    expect(view.focusItems[0].title).toBe("Memória de cuidado");
    expect(view.focusItems[0].valueLabel).toBe("1 célula com cuidado em andamento");
    expect(view.focusItems[0].href).toBe("/celulas/group-1?foco=em-cuidado");
  });

  it("transforma apoio com líderes em foco agregado, sem apontar para uma célula específica", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        attentionPeople: [
          signal({ id: "support", personId: "p2", assignedToId: user.id }),
        ],
        groups: [
          group({
            id: "group-support",
            attentionCount: 1,
            supportRequestsCount: 1,
          }),
        ],
      }),
      user,
    });

    expect(view.focusItems.map((item) => item.key)).toEqual(["support"]);
    expect(view.focusItems[0].title).toBe("Apoio com líderes");
    expect(view.focusItems[0].valueLabel).toBe("1 célula com apoio pedido");
    expect(view.nextAction?.label).toBe("Acompanhar com liderança");
    expect(view.nextAction?.href).toBe("/celulas/group-support?foco=apoio");
  });

  it("mantém sinais nas células fora de urgência e apoio", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        attentionPeople: [
          signal({ id: "urgent", personId: "p1", severity: SignalSeverity.URGENT }),
          signal({ id: "support", personId: "p2", assignedToId: user.id }),
        ],
        groups: [
          group({
            id: "group-urgent",
            attentionCount: 1,
            signals: [{ severity: SignalSeverity.URGENT, assignedTo: null }] as SupervisorGroup["signals"],
          }),
          group({
            id: "group-support",
            attentionCount: 1,
            supportRequestsCount: 1,
          }),
        ],
      }),
      user,
    });

    expect(view.focusItems.map((item) => item.key)).toEqual(["urgent", "support"]);
    expect(view.focusItems[0].valueLabel).toBe("1 célula urgente");
  });

  it("linka sinais nas células para o recorte de atenção local", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        attentionPeople: [
          signal({ id: "urgent", personId: "p1", severity: SignalSeverity.URGENT }),
          signal({ id: "attention", personId: "p2" }),
        ],
        groups: [
          group({
            id: "group-mixed",
            attentionCount: 2,
            signals: [{ severity: SignalSeverity.URGENT, assignedTo: null }] as SupervisorGroup["signals"],
          }),
        ],
      }),
      user,
    });

    const attentionFocus = view.focusItems.find((item) => item.key === "attention");

    expect(view.focusItems.map((item) => item.key)).toEqual(["urgent", "attention"]);
    expect(attentionFocus?.valueLabel).toBe("1 célula com sinal pastoral");
    expect(attentionFocus?.href).toBe("/celulas/group-mixed?foco=atencao");
  });

  it("usa presença sem registro como foco agregado de supervisão", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({ id: "group-no-presence", hasPresenceData: false, recordedEventsCount: 1 }),
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBe("attention");
    expect(view.focusItems.map((item) => item.key)).toEqual(["presence"]);
    expect(view.focusItems[0].tone).toBe("presence");
    expect(view.nextAction?.label).toBe("Revisar presença");
    expect(view.nextAction?.tone).toBe("presence");
    expect(view.nextAction?.href).toBe("/celulas/group-no-presence?foco=sem-presenca");
  });

  it("leva o recorte misto de presença para o filtro Presença", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({ id: "group-no-presence", hasPresenceData: false, recordedEventsCount: 1 }),
          group({ id: "group-low-presence", presenceRate: 60 }),
        ],
      }),
      user,
    });

    expect(view.focusItems.map((item) => item.key)).toEqual(["presence"]);
    expect(view.focusItems[0].tone).toBe("presence");
    expect(view.nextAction?.href).toBe("/celulas?filtro=presenca#celulas-supervisionadas");
  });

  it("mostra próxima ação estável quando não há foco aberto na supervisão", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({ id: "group-stable", name: "Célula Semear", recordedEventsCount: 2 }),
        ],
      }),
      user,
    });

    expect(view.firstUseState).toBeNull();
    expect(view.focusItems).toEqual([]);
    expect(view.nextAction).toMatchObject({
      eyebrow: "Células supervisionadas",
      title: "Sem pedidos de apoio no momento.",
      href: "/celulas/group-stable",
      label: "Ver Célula Semear",
      tone: "ok",
    });
  });

  it("mantém célula nova fora do foco de presença", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({ id: "group-new", hasPresenceData: false, recordedEventsCount: 0 }),
        ],
      }),
      user,
    });

    expect(view.navIndicator).toBeUndefined();
    expect(view.focusItems).toEqual([]);
    expect(view.nextAction).toBeNull();
    expect(view.firstUseState).toMatchObject({
      title: "A Célula Central ainda não tem histórico de encontros.",
      detail: "Após os primeiros registros, você verá estabilidade, presença e pedidos de apoio.",
      href: "/celulas/group-new",
      label: "Ver Célula Central",
    });
  });

  it("leva primeiro uso de múltiplas células para a lista de células", () => {
    const view = buildSupervisorPageView({
      dashboard: dashboard({
        groups: [
          group({ id: "group-a", name: "Célula Alfa", hasPresenceData: false, recordedEventsCount: 0 }),
          group({ id: "group-b", name: "Célula Beta", hasPresenceData: false, recordedEventsCount: 0 }),
        ],
      }),
      user,
    });

    expect(view.focusItems).toEqual([]);
    expect(view.nextAction).toBeNull();
    expect(view.firstUseState).toMatchObject({
      title: "As células supervisionadas ainda não têm histórico de encontros.",
      detail: "Após os primeiros registros, você verá estabilidade, presença e pedidos de apoio.",
      href: "/celulas",
      label: "Ver células",
    });
  });

});
