import { describe, expect, it } from "vitest";
import {
  buildTeamPageLists,
  compactGroupSubtitle,
  groupSignalLabel,
  groupSignalTone,
  groupMatchesFilter,
  inactiveGroupScheduleText,
  readTeamFilter,
  TEAM_FILTERS,
  teamFilterBackHref,
  teamFilterContent,
  teamGroupHref,
  supervisorSummary,
  teamNavIndicator,
  teamSavedMessage,
  type InactiveTeamGroup,
  type SupervisorTeam,
  type TeamGroup,
  type TeamOverview,
} from "./team-view";

function teamGroup(overrides: Partial<TeamGroup> = {}): TeamGroup {
  return {
    id: "group-1",
    name: "Célula Central",
    leadershipName: "Bruno",
    membersCount: 8,
    presenceRate: 90,
    hasPresenceData: true,
    hasLowPresence: false,
    hasNoPresenceData: false,
    attentionCount: 0,
    pastoralCasesCount: 0,
    supportRequestsCount: 0,
    localAttentionCount: 0,
    urgentCount: 0,
    inCareCount: 0,
    pastoralPriorityScore: 0,
    statusLabel: "Estável",
    ...overrides,
  };
}

function supervisor(overrides: Partial<SupervisorTeam> = {}): SupervisorTeam {
  return {
    id: "sup-1",
    name: "Ana",
    email: "ana@igreja.com",
    groups: [],
    highestPriorityScore: 0,
    groupsNeedingAttentionCount: 0,
    pastoralCasesCount: 0,
    urgentCount: 0,
    supportRequestsCount: 0,
    localAttentionCount: 0,
    attentionCount: 0,
    groupsWithoutPresenceCount: 0,
    lowPresenceGroupsCount: 0,
    ...overrides,
  };
}

function teamOverview(overrides: Partial<TeamOverview> = {}): TeamOverview {
  return {
    supervisors: [],
    unassignedGroups: [],
    summary: {
      supervisorsCount: 0,
      groupsCount: 0,
      pastoralCasesCount: 0,
      urgentCount: 0,
      attentionCount: 0,
      groupsNeedingAttentionCount: 0,
      groupsWithPastoralCasesCount: 0,
      groupsWithoutPresenceCount: 0,
      lowPresenceGroupsCount: 0,
      groupsWithoutSupervisorCount: 0,
    },
    ...overrides,
  };
}

const inactiveGroup: InactiveTeamGroup = {
  id: "inactive-1",
  name: "Célula Pausada",
  meetingDayOfWeek: 2,
  meetingTime: "20:00",
  locationName: "Casa da Maria",
};

describe("team-view", () => {
  it("normaliza filtros inválidos para todos", () => {
    expect(readTeamFilter("urgentes")).toBe("urgentes");
    expect(readTeamFilter("encaminhadas")).toBe("encaminhadas");
    expect(readTeamFilter("apoio")).toBe("apoio");
    expect(readTeamFilter("sem-presenca")).toBe("sem-presenca");
    expect(readTeamFilter("estaveis")).toBe("estaveis");
    expect(readTeamFilter("qualquer-coisa")).toBe("todos");
    expect(TEAM_FILTERS.find((filter) => filter.value === "encaminhadas"))
      .toMatchObject({ tone: "risk" });
  });

  it("filtra células pela classificação pastoral principal", () => {
    expect(groupMatchesFilter(teamGroup({ urgentCount: 1 }), "urgentes")).toBe(
      true,
    );
    expect(
      groupMatchesFilter(teamGroup({ pastoralCasesCount: 1 }), "encaminhadas"),
    ).toBe(true);
    expect(
      groupMatchesFilter(teamGroup({ supportRequestsCount: 1 }), "apoio"),
    ).toBe(true);
    expect(
      groupMatchesFilter(teamGroup({ localAttentionCount: 1 }), "atencao"),
    ).toBe(true);
    expect(
      groupMatchesFilter(
        teamGroup({
          hasPresenceData: false,
          hasNoPresenceData: true,
          presenceRate: 0,
        }),
        "sem-presenca",
      ),
    ).toBe(true);
    expect(groupMatchesFilter(teamGroup(), "estaveis")).toBe(true);
    expect(
      groupMatchesFilter(
        teamGroup({ urgentCount: 1, supportRequestsCount: 1 }),
        "apoio",
      ),
    ).toBe(false);
  });

  it("filtra supervisores mantendo supervisor sem grupo apenas na visão padrão", () => {
    const attentionGroup = teamGroup({
      localAttentionCount: 1,
      pastoralPriorityScore: 10,
      statusLabel: "Atenção local",
    });
    const emptySupervisor = supervisor({
      id: "sup-empty",
      name: "Pedro",
      groups: [],
    });
    const activeSupervisor = supervisor({ groups: [attentionGroup] });
    const team = teamOverview({
      supervisors: [emptySupervisor, activeSupervisor],
    });

    expect(
      buildTeamPageLists({
        team,
        inactiveGroups: [],
        normalizedQuery: "",
        activeFilter: "todos",
      }).filteredSupervisors,
    ).toHaveLength(2);
    expect(
      buildTeamPageLists({
        team,
        inactiveGroups: [],
        normalizedQuery: "",
        activeFilter: "atencao",
      }).filteredSupervisors,
    ).toHaveLength(1);
  });

  it("inclui inativas apenas no filtro padrão", () => {
    const team = teamOverview();

    expect(
      buildTeamPageLists({
        team,
        inactiveGroups: [inactiveGroup],
        normalizedQuery: "pausada",
        activeFilter: "todos",
      }).filteredInactiveGroups,
    ).toHaveLength(1);
    expect(
      buildTeamPageLists({
        team,
        inactiveGroups: [inactiveGroup],
        normalizedQuery: "pausada",
        activeFilter: "sem-presenca",
      }).filteredInactiveGroups,
    ).toHaveLength(0);
  });

  it("resume supervisor sem enumerar sinais no cabeçalho", () => {
    expect(
      supervisorSummary(supervisor({ groups: [teamGroup()], urgentCount: 1 })),
    ).toBe("1 célula acompanhada");
    expect(
      supervisorSummary(
        supervisor({
          groups: [teamGroup(), teamGroup({ id: "group-2" })],
          pastoralCasesCount: 2,
        }),
      ),
    ).toBe("2 células acompanhadas");
    expect(
      supervisorSummary(
        supervisor({ groups: [teamGroup()], supportRequestsCount: 1 }),
      ),
    ).toBe("1 célula acompanhada");
  });

  it("resolve o sinal visual do grupo por prioridade pastoral", () => {
    expect(groupSignalTone(teamGroup({ urgentCount: 1 }))).toBe("risk");
    expect(groupSignalLabel(teamGroup({ urgentCount: 1, pastoralCasesCount: 1 }))).toBe("Cuidado próximo");
    expect(groupSignalLabel(teamGroup({ pastoralCasesCount: 1 }))).toBe("Encaminhada");
    expect(groupSignalLabel(teamGroup({ pastoralCasesCount: 2 }))).toBe("Encaminhadas");
    expect(
      groupSignalTone(
        teamGroup({
          supportRequestsCount: 1,
          statusLabel: "1 pedido de apoio",
        }),
      ),
    ).toBe("support");
    expect(
      groupSignalTone(
        teamGroup({
          localAttentionCount: 1,
          statusLabel: "1 irmão em atenção",
        }),
      ),
    ).toBe("warn");
    expect(groupSignalTone(teamGroup({ hasPresenceData: false }))).toBe(
      "neutral",
    );
    expect(groupSignalTone(teamGroup({ presenceRate: 60 }))).toBe("warn");
    expect(groupSignalTone(teamGroup({ presenceRate: 80 }))).toBe("ok");
    expect(groupSignalLabel(teamGroup({ supportRequestsCount: 1 }))).toBe(
      "Apoio pedido",
    );
  });

  it("monta links de equipe preservando filtro para o detalhe da célula", () => {
    expect(teamFilterBackHref("todos")).toBe("/equipe");
    expect(teamFilterBackHref("apoio")).toBe("/equipe?filtro=apoio");
    expect(teamGroupHref("group-1", "todos")).toBe("/celulas/group-1");
    expect(teamGroupHref("group-1", "apoio")).toBe(
      "/celulas/group-1?from=equipe&filtro=apoio&foco=apoio",
    );
  });

  it("monta textos auxiliares da página", () => {
    expect(inactiveGroupScheduleText(inactiveGroup)).toBe("Terça · 20:00");
    expect(
      compactGroupSubtitle(
        teamGroup({ leadershipName: "Diego e Paula", membersCount: 12 }),
      ),
    ).toBe("12 membros · Diego e Paula");
    expect(teamSavedMessage("celula-criada")).toBe("Célula criada.");
    expect(teamSavedMessage("outro")).toBeNull();
    expect(teamFilterContent("apoio")).toMatchObject({
      contextTitle: "Apoio pedido",
      listTitle: "Apoio pedido por supervisor",
    });
    expect(
      teamNavIndicator(
        teamOverview({
          summary: { ...teamOverview().summary, pastoralCasesCount: 1 },
        }).summary,
      ),
    ).toBe("risk");
  });
});
