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
  title: string;
  description: string;
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

  const latestTouchLabel = input.latestTouch ? input.latestTouch.title : "Sem cuidado registrado";
  const latestTouchDetail = input.latestTouch
    ? `${input.latestTouch.actorName} · ${input.latestTouch.happenedAtLabel}${input.latestTouch.contextLabel ? ` · ${input.latestTouch.contextLabel}` : ""}`
    : "Use o registro de cuidado depois de uma conversa real para formar histórico pastoral.";

  if (input.openSignalsCount > 0) {
    return {
      priorityTone: input.hasRiskSignal ? "risk" : "warn",
      badgeTone: input.hasRiskSignal ? "risk" : "warn",
      badgeLabel: input.hasRiskSignal ? "Ação prioritária" : "Atenção aberta",
      title: input.hasRiskSignal ? "Acompanhamento urgente" : "Acompanhamento em aberto",
      description: input.hasRiskSignal
        ? "Há um sinal sensível ou urgente. Veja o motivo, alinhe com quem acompanha e registre apenas cuidado real."
        : "Há motivo de atenção aberto. A tela mostra quem acompanha, o histórico e o próximo registro recomendado.",
      ownerLabel: ownerName,
      ownerDetail,
      latestTouchLabel,
      latestTouchDetail,
      nextStepLabel: input.canRegisterCare ? "Registrar contato pastoral" : "Alinhar com a liderança responsável",
      nextStepDetail: input.hasPhone
        ? "Converse por ligação, WhatsApp ou pessoalmente; depois registre o cuidado no histórico."
        : "Sem telefone cadastrado. Registre apenas um cuidado que já aconteceu fora do app.",
      actionLabel: input.canRegisterCare ? "Ir para registro" : "Ver contexto",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  if (input.isInCare) {
    return {
      priorityTone: "care",
      badgeTone: "care",
      badgeLabel: "Em cuidado",
      title: "Cuidado em andamento",
      description: "A pessoa já está em acompanhamento. Atualize o histórico quando houver novo contato ou marque como ativa quando estiver tudo bem.",
      ownerLabel: ownerName,
      ownerDetail,
      latestTouchLabel,
      latestTouchDetail,
      nextStepLabel: input.canRegisterCare ? "Atualizar acompanhamento" : "Consultar histórico",
      nextStepDetail: "Revise o último cuidado antes de registrar outro contato ou encerrar o destaque pastoral.",
      actionLabel: input.canRegisterCare ? "Atualizar cuidado" : "Mostrar histórico completo",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  return {
    priorityTone: "muted",
    badgeTone: "ok",
    badgeLabel: "Estável",
    title: "Acompanhamento disponível",
    description: "Nada exige ação agora. O histórico continua disponível para consulta e novos registros reais de cuidado.",
    ownerLabel: ownerName,
    ownerDetail,
    latestTouchLabel,
    latestTouchDetail,
    nextStepLabel: input.canRegisterCare ? "Registrar quando houver cuidado" : "Consultar contexto",
    nextStepDetail: input.hasPhone
      ? "Use o registro somente depois de ligação, WhatsApp, conversa ou anotação pastoral relevante."
      : "Sem telefone cadastrado. O registro manual segue disponível quando houver cuidado real.",
    actionLabel: input.canRegisterCare ? "Registrar cuidado" : "Ver contexto",
    actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
  };
}
