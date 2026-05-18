import type { UserRole } from "@/generated/prisma/client";
import { buildWeeklyPresenceSummaryItem, type WeeklyPresenceSummary, type WeeklyPresenceSummaryItem } from "@/features/dashboard/presence-health";
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
  detail?: string;
  tone?: "ok" | "warn" | "risk" | "neutral";
};

export type PastorPageView = {
  navIndicator?: "risk" | "attention";
  pastoralPulse: PastoralPulseMessage;
  teamSummaryItems: PastorPageSummaryItem[];
  healthOverview: PastoralHealthOverview;
  presenceSummary: WeeklyPresenceSummaryItem[];
};

function buildPastorMacroPulse(summary: PastorPageTeamSummary): PastoralPulseMessage {
  if (summary.urgentCount > 0) {
    return {
      title: summary.urgentCount === 1
        ? "Há um sinal urgente no radar pastoral."
        : `${summary.urgentCount} sinais urgentes no radar pastoral.`,
      subtitle: "Veja as células com calma antes de orientar a equipe.",
      tone: "attention",
    };
  }

  if (summary.pastoralCasesCount > 0) {
    return {
      title: summary.pastoralCasesCount === 1
        ? "Há um encaminhamento ao pastor."
        : `${summary.pastoralCasesCount} encaminhamentos ao pastor.`,
      subtitle: "Os casos encaminhados aparecem no contexto das células.",
      tone: "attention",
    };
  }

  if (summary.supportRequestsCount > 0) {
    return {
      title: summary.supportRequestsCount === 1
        ? "Há um pedido de apoio na equipe."
        : `${summary.supportRequestsCount} pedidos de apoio na equipe.`,
      subtitle: "A supervisão acompanha esses pedidos; veja as células quando precisar de contexto.",
      tone: "calm",
    };
  }

  if (summary.groupsNeedingAttentionCount > 0) {
    return {
      title: summary.groupsNeedingAttentionCount === 1
        ? "Uma célula pede atenção pastoral."
        : `${summary.groupsNeedingAttentionCount} células pedem atenção pastoral.`,
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
      detail: "Acompanhamento pastoral.",
      tone: "neutral",
    },
    {
      label: "Células ativas",
      value: String(summary.groupsCount),
      detail: "Células em acompanhamento.",
      tone: "neutral",
    },
    {
      label: "Sem supervisor",
      value: String(summary.groupsWithoutSupervisorCount),
      detail: summary.groupsWithoutSupervisorCount > 0
        ? "Precisam de responsável."
        : "Todas vinculadas.",
      tone: summary.groupsWithoutSupervisorCount > 0 ? "warn" : "ok",
    },
    {
      label: "Inativas",
      value: String(summary.inactiveGroupsCount),
      detail: summary.inactiveGroupsCount > 0
        ? "Fora do acompanhamento ativo."
        : "Nenhuma célula pausada.",
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
    teamSummaryItems: buildTeamSummaryItems(teamSummary),
    healthOverview: dashboard.healthOverview,
    presenceSummary: [buildWeeklyPresenceSummaryItem(dashboard.weeklyPresence)],
  };
}
