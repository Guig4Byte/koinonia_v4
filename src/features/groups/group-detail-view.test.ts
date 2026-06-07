import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  groupDetailFocusCard,
  groupMemberFocusKeys,
  groupMeetingText,
  memberBadgeLabelForCareContext,
  memberBadgeToneForCareContext,
  groupMemberPriorityRank,
  groupMembersSectionDetail,
  readGroupDetailFocus,
  resolveGroupMembersInitialFilter,
  type GroupDetailMembership,
  type GroupDetailSignal,
  type GroupDetailViewer,
} from "./group-detail-view";

const viewer: GroupDetailViewer = { id: "leader-1", role: UserRole.LEADER };

function signal(overrides: Partial<GroupDetailSignal> = {}): GroupDetailSignal {
  return {
    id: "signal-1",
    personId: "person-1",
    severity: SignalSeverity.ATTENTION,
    assignedToId: null,
    assignedTo: null,
    detectedAt: new Date("2026-01-01T12:00:00Z"),
    reason: "Ausência recente",
    evidence: null,
    source: null,
    ...overrides,
  };
}

function membership(id: string, fullName: string, status: PersonStatus): GroupDetailMembership {
  return {
    id: `membership-${id}`,
    personId: `person-${id}`,
    person: { fullName, status },
  };
}

describe("groupMeetingText", () => {
  it("formats default day and time", () => {
    expect(groupMeetingText(3, "19:30")).toBe("Quarta · 19:30");
  });

  it("keeps a useful empty state when there is no fixed schedule", () => {
    expect(groupMeetingText(null, null)).toBe("Encontro sem horário fixo informado.");
  });
});

describe("groupMemberPriorityRank", () => {
  it("keeps urgent or pastoral signals at the top", () => {
    expect(groupMemberPriorityRank(signal({ severity: SignalSeverity.URGENT }), PersonStatus.ACTIVE, viewer)).toBe(1);
  });

  it("keeps in-care people before active people when there is no open signal", () => {
    expect(groupMemberPriorityRank(undefined, PersonStatus.COOLING_AWAY, viewer)).toBe(4);
    expect(groupMemberPriorityRank(undefined, PersonStatus.ACTIVE, viewer)).toBe(5);
  });
});

describe("buildGroupMemberDisplays", () => {
  it("sorts people by pastoral priority before name", () => {
    const attentionSignal = signal({ personId: "person-2" });
    const members = buildGroupMemberDisplays({
      memberships: [
        membership("1", "Bruno", PersonStatus.ACTIVE),
        membership("2", "Ana", PersonStatus.ACTIVE),
        membership("3", "Camila", PersonStatus.COOLING_AWAY),
      ],
      attentionSignalsByPersonId: new Map([[attentionSignal.personId, attentionSignal]]),
      viewer,
    });

    expect(members.map((member) => member.name)).toEqual(["Ana", "Camila", "Bruno"]);
  });

  it("mantém o motivo do sinal e também expõe o status em cuidado", () => {
    const supportSignal = signal({ personId: "person-1", assignedTo: { role: UserRole.SUPERVISOR } });
    const [member] = buildGroupMemberDisplays({
      memberships: [membership("1", "Ana", PersonStatus.COOLING_AWAY)],
      attentionSignalsByPersonId: new Map([[supportSignal.personId, supportSignal]]),
      viewer,
    });

    expect(member.badgeLabel).toBe("Apoio solicitado");
    expect(member.subtitle).toContain("Em cuidado");
    expect(memberBadgeLabelForCareContext(member)).toBe("Em cuidado");
    expect(memberBadgeToneForCareContext(member)).toBe("care");
  });
});


describe("group detail focus", () => {
  it("normaliza foco inválido", () => {
    expect(readGroupDetailFocus("apoio")).toBe("apoio");
    expect(readGroupDetailFocus("urgentes")).toBe("urgentes");
    expect(readGroupDetailFocus("em-cuidado")).toBe("em-cuidado");
    expect(readGroupDetailFocus("presenca-baixa")).toBe("presenca-baixa");
    expect(readGroupDetailFocus("todos")).toBeNull();
    expect(readGroupDetailFocus("outro")).toBeNull();
  });

  it("classifica o foco do membro pela origem do sinal", () => {
    expect(groupMemberFocusKeys(signal({ severity: SignalSeverity.URGENT }), PersonStatus.ACTIVE, viewer)).toEqual(["urgentes"]);
    expect(groupMemberFocusKeys(signal({ assignedTo: { role: UserRole.PASTOR } }), PersonStatus.ACTIVE, viewer)).toEqual(["encaminhadas"]);
    expect(groupMemberFocusKeys(signal({ assignedTo: { role: UserRole.SUPERVISOR } }), PersonStatus.ACTIVE, { ...viewer, role: UserRole.PASTOR })).toEqual(["apoio"]);
    expect(groupMemberFocusKeys(undefined, PersonStatus.COOLING_AWAY, viewer)).toEqual(["em-cuidado"]);
    expect(groupMemberFocusKeys(signal(), PersonStatus.COOLING_AWAY, viewer)).toEqual(["atencao", "em-cuidado"]);
  });

  it("monta o card de foco do detalhe da célula", () => {
    expect(groupDetailFocusCard("apoio", 2)).toMatchObject({ title: "Pedido de apoio nesta célula", tone: "default" });
    expect(groupDetailFocusCard("em-cuidado", 1)).toMatchObject({ title: "Em cuidado nesta célula", tone: "default" });
    expect(groupDetailFocusCard("sem-presenca", 0)).toMatchObject({ title: "Retomar contato" });
    expect(groupDetailFocusCard("presenca-baixa", 0)).toMatchObject({ title: "Presença baixa nesta célula", tone: "warning" });
    expect(groupDetailFocusCard(null, 0)).toBeNull();
  });
});

describe("buildGroupMembersView", () => {
  it("separa sinais, pessoas em cuidado e membros ativos", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Em atenção", badgeTone: "warn" as const, priorityRank: 3, status: PersonStatus.ACTIVE, focusKeys: ["atencao" as const] },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Em cuidado", badgeTone: "care" as const, priorityRank: 4, status: PersonStatus.COOLING_AWAY, focusKeys: ["em-cuidado" as const] },
      { membershipId: "3", personId: "3", name: "Caio", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    const view = buildGroupMembersView(members, "todos");

    expect(view.priorityMembers.map((member) => member.name)).toEqual(["Ana"]);
    expect(view.inCareMembers.map((member) => member.name)).toEqual(["Bruno"]);
    expect(view.regularMembers.map((member) => member.name)).toEqual(["Caio"]);
    expect(view.filterCounts).toMatchObject({ atencao: 1, "em-cuidado": 1, ativos: 1 });
    expect(view.sectionDetail).toBe("3 membros · 1 sinal aberto · 1 em cuidado");
  });

  it("uses the filtered count when the selected filter is not todos", () => {
    expect(groupMembersSectionDetail({ totalCount: 10, priorityCount: 2, visibleCount: 1, activeFilter: "em-cuidado" })).toBe("1 irmão neste recorte");
  });


  it("mantém os sinais separados das pessoas em cuidado quando a célula veio por um foco", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Pedido de apoio", badgeTone: "support" as const, priorityRank: 2, status: PersonStatus.ACTIVE, focusKeys: ["apoio" as const] },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Em atenção", badgeTone: "warn" as const, priorityRank: 3, status: PersonStatus.ACTIVE, focusKeys: ["atencao" as const] },
      { membershipId: "3", personId: "3", name: "Camila", badgeLabel: "Em cuidado", badgeTone: "care" as const, priorityRank: 4, status: PersonStatus.COOLING_AWAY, focusKeys: ["em-cuidado" as const] },
      { membershipId: "4", personId: "4", name: "Daniel", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    const view = buildGroupMembersView(members, "todos", "apoio");

    expect(view.priorityMembers.map((member) => member.name)).toEqual(["Ana", "Bruno"]);
    expect(view.inCareMembers.map((member) => member.name)).toEqual(["Camila"]);
    expect(view.regularMembers.map((member) => member.name)).toEqual(["Daniel"]);
    expect(view.focusedMembersCount).toBe(1);
  });

  it("conta pessoas em cuidado no foco sem esconder os demais membros", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Em cuidado", badgeTone: "care" as const, priorityRank: 4, status: PersonStatus.COOLING_AWAY, focusKeys: ["em-cuidado" as const] },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    const view = buildGroupMembersView(members, "todos", "em-cuidado");

    expect(view.priorityMembers).toHaveLength(0);
    expect(view.inCareMembers.map((member) => member.name)).toEqual(["Ana"]);
    expect(view.regularMembers.map((member) => member.name)).toEqual(["Bruno"]);
    expect(view.focusedMembersCount).toBe(1);
  });

  it("mostra em cuidado como recorte proprio quando o filtro esta selecionado", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Em cuidado", badgeTone: "care" as const, priorityRank: 4, status: PersonStatus.COOLING_AWAY, focusKeys: ["em-cuidado" as const] },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Em atenção", badgeTone: "warn" as const, priorityRank: 3, status: PersonStatus.COOLING_AWAY, focusKeys: ["atencao" as const, "em-cuidado" as const] },
      { membershipId: "3", personId: "3", name: "Caio", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    const view = buildGroupMembersView(members, "em-cuidado");

    expect(view.regularMembers.map((member) => member.name)).toEqual(["Ana"]);
    expect(view.priorityMembers.map((member) => member.name)).toEqual(["Bruno"]);
    expect(view.inCareMembers.map((member) => member.name)).toEqual(["Ana"]);
  });

  it("abre em sem sinal aberto quando o filtro inicial padrao nao tem sinais", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    expect(resolveGroupMembersInitialFilter(members, "atencao", false)).toBe("ativos");
    expect(buildGroupMembersView(members, "ativos").sectionDetail).toBe("2 irmãos neste recorte");
  });

  it("respeita o filtro sinais quando ele foi pedido explicitamente", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Sem sinal aberto", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE, focusKeys: [] },
    ];

    expect(resolveGroupMembersInitialFilter(members, "atencao", true)).toBe("atencao");
  });

});
