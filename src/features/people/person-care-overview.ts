import type { BadgeTone } from "@/components/ui/badge";
import type { CardPriorityTone } from "@/lib/card-priority";

export type PersonCareOverviewLatestTouch = {
  title: string;
  actorName: string;
  happenedAtLabel: string;
  contextLabel?: string | null;
};

export type PersonCareOverviewInput = {
  openSignalsCount: number;
  hasRiskSignal: boolean;
  isInCare: boolean;
  hasPhone: boolean;
  canRegisterCare: boolean;
  primaryGroupName: string;
  primaryLeadershipName?: string | null;
  assignedActorName?: string | null;
  latestTouch?: PersonCareOverviewLatestTouch | null;
};

export type PersonCareOverviewView = {
  priorityTone: CardPriorityTone;
  badgeTone: BadgeTone;
  badgeLabel: string;
  ownerLabel: string;
  ownerDetail: string;
  latestTouchLabel: string;
  latestTouchDetail: string;
  nextStepLabel: string;
  nextStepDetail: string;
  actionLabel: string;
  actionHref: "#registrar-cuidado" | "#historico-cuidado";
};

export function buildPersonCareOverviewView(input: PersonCareOverviewInput): PersonCareOverviewView {
  const ownerName = input.assignedActorName || input.primaryLeadershipName || "Liderança da célula";
  const ownerDetail = input.assignedActorName
    ? "Responsável ligado ao sinal aberto."
    : input.primaryLeadershipName
      ? `${input.primaryGroupName} · liderança responsável.`
      : `${input.primaryGroupName} · responsável não informado.`;

  const latestTouchLabel = input.latestTouch ? input.latestTouch.title : "Sem cuidado recente";
  const latestTouchDetail = input.latestTouch
    ? `${input.latestTouch.actorName} · ${input.latestTouch.happenedAtLabel}${input.latestTouch.contextLabel ? ` · ${input.latestTouch.contextLabel}` : ""}`
    : "Guarde o cuidado depois de uma conversa real para formar memória pastoral.";

  if (input.openSignalsCount > 0) {
    return {
      priorityTone: input.hasRiskSignal ? "risk" : "warn",
      badgeTone: input.hasRiskSignal ? "risk" : "warn",
      badgeLabel: input.hasRiskSignal ? "Ação prioritária" : "Atenção aberta",
      ownerLabel: ownerName,
      ownerDetail,
      latestTouchLabel,
      latestTouchDetail,
      nextStepLabel: input.canRegisterCare ? "Guardar contato pastoral" : "Alinhar com a liderança responsável",
      nextStepDetail: input.hasPhone
        ? "Converse por ligação, WhatsApp ou pessoalmente; depois guarde o cuidado no histórico."
        : "Sem telefone cadastrado. Guarde apenas um cuidado que já aconteceu fora do app.",
      actionLabel: input.canRegisterCare ? "Guardar cuidado" : "Ver contexto",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  if (input.isInCare) {
    return {
      priorityTone: "care",
      badgeTone: "care",
      badgeLabel: "Em cuidado",
      ownerLabel: ownerName,
      ownerDetail,
      latestTouchLabel,
      latestTouchDetail,
      nextStepLabel: input.canRegisterCare ? "Atualizar acompanhamento" : "Consultar histórico",
      nextStepDetail: "Revise o último cuidado antes de guardar outro contato ou encerrar o destaque pastoral.",
      actionLabel: input.canRegisterCare ? "Atualizar cuidado" : "Mostrar histórico completo",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  return {
    priorityTone: "muted",
    badgeTone: "ok",
    badgeLabel: "Estável",
    ownerLabel: ownerName,
    ownerDetail,
    latestTouchLabel,
    latestTouchDetail,
    nextStepLabel: input.canRegisterCare ? "Guardar quando houver cuidado" : "Consultar contexto",
    nextStepDetail: input.hasPhone
      ? "Guarde aqui somente depois de ligação, WhatsApp, conversa ou anotação pastoral relevante."
      : "Sem telefone cadastrado. Ainda dá para guardar cuidado real manualmente.",
    actionLabel: input.canRegisterCare ? "Guardar cuidado" : "Ver contexto",
    actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
  };
}
