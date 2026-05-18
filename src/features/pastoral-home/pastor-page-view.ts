import type { UserRole } from "@/generated/prisma/client";
import type { WeeklyPresenceSummary } from "@/features/dashboard/presence-health";
import type { PastoralHealthOverview } from "@/features/dashboard/pastoral-health";
import type { PastoralPulseMessage } from "@/features/pastoral-pulse";

export type PastorPageViewer = {
  id: string;
  role: UserRole;
};

export type PastorPageTeamSummary = {
  supervisorsCount: number;
  groupsCount: number;
  groupsWithoutSupervisorCount: number;
  inactiveGroupsCount: number;
  urgentCount: number;
  pastoralCasesCount: number;
  supportRequestsCount: number;
  groupsNeedingAttentionCount: number;
};

export type PastorPageDashboard = {
  teamSummary: PastorPageTeamSummary;
  healthOverview: PastoralHealthOverview;
  weeklyPresence: WeeklyPresenceSummary;
};

export type PastorPageSummaryItem = {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "risk" | "neutral";
};

export type PastorPageView = {
  navIndicator?: "risk" | "attention";
  pastoralPulse: PastoralPulseMessage;
  radarSummary: string;
  teamSummaryItems: PastorPageSummaryItem[];
  healthOverview: PastoralHealthOverview;
  weeklyPresence: WeeklyPresenceSummary;
};

function buildPastorMacroPulse(summary: PastorPageTeamSummary): PastoralPulseMessage {
  if (summary.urgentCount > 0) {
    return {
      title: "Há sinais que pedem um olhar mais próximo.",
      subtitle: "Veja com calma onde a equipe precisa de mais proximidade.",
      tone: "attention",
    };
  }

  if (summary.pastoralCasesCount > 0 || summary.supportRequestsCount > 0) {
    return {
      title: "Seu radar de cuidado está ativo.",
      subtitle: "Há células que merecem leitura pastoral antes de orientar a equipe.",
      tone: "attention",
    };
  }

  if (summary.groupsNeedingAttentionCount > 0) {
    return {
      title: "Há células que pedem acompanhamento próximo.",
      subtitle: "A visão mostra a saúde geral; os detalhes ficam no contexto da célula.",
      tone: "calm",
    };
  }

  return {
    title: "A equipe pastoral está estável agora.",
    subtitle: "Atenções locais seguem com líderes e supervisores; use a busca quando precisar consultar alguém.",
    tone: "ok",
  };
}

function buildTeamSummaryItems(summary: PastorPageTeamSummary): PastorPageSummaryItem[] {
  return [
    {
      label: "Supervisores",
      value: String(summary.supervisorsCount),
      tone: "neutral",
    },
    {
      label: "Células ativas",
      value: String(summary.groupsCount),
      tone: "neutral",
    },
    {
      label: "Sem supervisor",
      value: String(summary.groupsWithoutSupervisorCount),
      tone: summary.groupsWithoutSupervisorCount > 0 ? "warn" : "ok",
    },
    {
      label: "Inativas",
      value: String(summary.inactiveGroupsCount),
      tone: "neutral",
    },
  ];
}

export function buildPastorPageView({
  dashboard,
}: {
  dashboard: PastorPageDashboard;
  user: PastorPageViewer;
}): PastorPageView {
  const { teamSummary } = dashboard;

  return {
    navIndicator: teamSummary.urgentCount > 0 || teamSummary.pastoralCasesCount > 0
      ? "risk"
      : teamSummary.groupsNeedingAttentionCount > 0
        ? "attention"
        : undefined,
    pastoralPulse: buildPastorMacroPulse(teamSummary),
    radarSummary: dashboard.healthOverview.narrativeSummary,
    teamSummaryItems: buildTeamSummaryItems(teamSummary),
    healthOverview: dashboard.healthOverview,
    weeklyPresence: dashboard.weeklyPresence,
  };
}
