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
    expect(view.pastoralPulse.title).toBe("Há sinais que pedem um olhar mais próximo.");
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
        tone: "neutral",
      },
      {
        label: "Células ativas",
        value: "9",
        tone: "neutral",
      },
      {
        label: "Supervisão a definir",
        value: "1",
        tone: "warn",
      },
      {
        label: "Inativas",
        value: "2",
        tone: "neutral",
      },
    ]);
  });

  it("preserva o resumo semanal para o card de presença", () => {
    const view = buildPastorPageView({
      dashboard: dashboard({
        weeklyPresence: {
          hasPresenceData: true,
          presenceRate: 79,
          recordedEventsCount: 4,
          monthTrend: { direction: "up", delta: 5, currentRate: 79, previousRate: 74 },
        },
      }),
      user,
    });

    expect(view.weeklyPresence).toEqual({
      hasPresenceData: true,
      presenceRate: 79,
      recordedEventsCount: 4,
      monthTrend: { direction: "up", delta: 5, currentRate: 79, previousRate: 74 },
    });
  });
});
