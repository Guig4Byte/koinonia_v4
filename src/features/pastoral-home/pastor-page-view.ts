import type { UserRole } from "@/generated/prisma/client";
import type { WeeklyPresenceSummary } from "@/features/dashboard/presence-health";
import type { PastoralHealthOverview } from "@/features/dashboard/pastoral-health";
import type { PastoralPulseMessage } from "@/features/pastoral-pulse";
import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import { FILTER_ATTENTION, FILTER_PASTORAL, FILTER_SUPPORT, FILTER_URGENT } from "@/lib/filter-param";
import { countLabel } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

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
  teamSummaryItems: PastorPageSummaryItem[];
  healthOverview: PastoralHealthOverview;
  weeklyPresence: WeeklyPresenceSummary;
  nextAction: NextPastoralAction | null;
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

function teamFilterHref(filter: string) {
  return `${ROUTES.teamFilter(filter)}#supervisores`;
}

export function buildPastorNextPastoralAction(summary: PastorPageTeamSummary): NextPastoralAction | null {
  if (summary.urgentCount > 0) {
    return {
      eyebrow: "Prioridade de hoje",
      title: `${countLabel(summary.urgentCount, "sinal urgente", "sinais urgentes")} na equipe`,
      detail: "Comece pelas células com cuidado mais sensível antes de revisar estabilidade e presença.",
      href: teamFilterHref(FILTER_URGENT),
      label: "Ver cuidados",
      tone: "risk",
    };
  }

  if (summary.pastoralCasesCount > 0) {
    return {
      eyebrow: "Encaminhadas ao pastor",
      title: `${countLabel(summary.pastoralCasesCount, "caso encaminhado", "casos encaminhados")} para discernir`,
      detail: "Veja os casos trazidos pela liderança e defina o próximo passo pastoral.",
      href: teamFilterHref(FILTER_PASTORAL),
      label: "Ver encaminhadas",
      tone: "risk",
    };
  }

  if (summary.supportRequestsCount > 0) {
    return {
      eyebrow: "Pedido de apoio",
      title: `${countLabel(summary.supportRequestsCount, "pedido de apoio", "pedidos de apoio")} na equipe`,
      detail: "Acompanhe onde líderes e supervisores pediram suporte antes de olhar os demais indicadores.",
      href: teamFilterHref(FILTER_SUPPORT),
      label: "Ver apoios",
      tone: "support",
    };
  }

  if (summary.groupsNeedingAttentionCount > 0) {
    return {
      eyebrow: "Células em atenção",
      title: `${countLabel(summary.groupsNeedingAttentionCount, "célula pede", "células pedem")} acompanhamento`,
      detail: "Revise presença, cuidado e estabilidade para orientar supervisores com mais clareza.",
      href: teamFilterHref(FILTER_ATTENTION),
      label: "Ver células em atenção",
      tone: "warn",
    };
  }

  return {
    eyebrow: "Leitura rápida",
    title: "Equipe pastoral estável",
    detail: "Use a visão de equipe para manter vínculos e agenda das células organizados.",
    href: `${ROUTES.team}#supervisores`,
    label: "Ver equipe",
    tone: "ok",
  };
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
    weeklyPresence: dashboard.weeklyPresence,
    nextAction: buildPastorNextPastoralAction(teamSummary),
  };
}
