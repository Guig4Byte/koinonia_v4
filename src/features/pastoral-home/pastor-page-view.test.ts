import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { buildPastoralHealthOverview } from "@/features/dashboard/pastoral-health";
import { buildPastorPageView, type PastorPageDashboard, type PastorPageTeamSummary } from "./pastor-page-view";

const user = { id: "pastor-1", role: UserRole.PASTOR };

function teamSummary(overrides: Partial<PastorPageTeamSummary> = {}): PastorPageTeamSummary {
  return {
    supervisorsCount: 4,
    groupsCount: 9,
    groupsWithoutSupervisorCount: 0,
    inactiveGroupsCount: 1,
    urgentCount: 0,
    pastoralCasesCount: 0,
    supportRequestsCount: 0,
    groupsNeedingAttentionCount: 0,
    ...overrides,
  };
}

function dashboard(overrides: Partial<PastorPageDashboard> = {}): PastorPageDashboard {
  return {
    teamSummary: overrides.teamSummary ?? teamSummary(),
    healthOverview: overrides.healthOverview ?? buildPastoralHealthOverview([]),
    weeklyPresence: overrides.weeklyPresence ?? {
      hasPresenceData: false,
      presenceRate: 0,
      recordedEventsCount: 0,
    },
  };
}

describe("pastor-page-view", () => {
  it("prioriza urgentes na leitura macro do pastor", () => {
    const view = buildPastorPageView({
      dashboard: dashboard({ teamSummary: teamSummary({ urgentCount: 2, pastoralCasesCount: 3, groupsNeedingAttentionCount: 4 }) }),
      user,
    });

    expect(view.navIndicator).toBe("risk");
    expect(view.pastoralPulse.title).toBe("2 sinais urgentes no radar pastoral.");
    expect(view.healthOverview.totalGroups).toBe(0);
  });

  it("monta resumo de equipe sem listar pessoas na visão", () => {
    const view = buildPastorPageView({
      dashboard: dashboard({ teamSummary: teamSummary({ groupsWithoutSupervisorCount: 1, inactiveGroupsCount: 2 }) }),
      user,
    });

    expect(view.teamSummaryItems).toEqual([
      {
        label: "Supervisores",
        value: "4",
        detail: "Acompanhamento pastoral.",
        tone: "neutral",
      },
      {
        label: "Células ativas",
        value: "9",
        detail: "Células em acompanhamento.",
        tone: "neutral",
      },
      {
        label: "Sem supervisor",
        value: "1",
        detail: "Precisam de responsável.",
        tone: "warn",
      },
      {
        label: "Inativas",
        value: "2",
        detail: "Fora do acompanhamento ativo.",
        tone: "neutral",
      },
    ]);
  });

  it("monta resumo neutro quando ainda não há presença semanal", () => {
    const view = buildPastorPageView({ dashboard: dashboard(), user });

    expect(view.presenceSummary).toEqual([
      {
        label: "Presença da semana",
        value: "—",
        detail: "Nenhum encontro registrado nesta semana.",
        tone: "neutral",
      },
    ]);
  });

  it("usa tom pastoral da presença registrada", () => {
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 60, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("risk");
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 70, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("warn");
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 85, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("ok");
  });
});
