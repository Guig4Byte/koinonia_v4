import type { CardPriorityTone } from "@/lib/card-priority";

export type PersonCareOverviewInput = {
  openSignalsCount: number;
  hasRiskSignal: boolean;
  isInCare: boolean;
  hasPhone: boolean;
  canRegisterCare: boolean;
  primaryGroupName: string;
  primaryLeadershipName?: string | null;
  assignedActorName?: string | null;
};

export type PersonCareOverviewView = {
  priorityTone: CardPriorityTone;
  signalLabel: string;
  contextLabel: string;
  nextStepLabel: string;
  nextStepDetail: string;
  actionLabel: string;
  actionHref: "#registrar-cuidado" | "#historico-cuidado";
};

export function buildPersonCareOverviewView(input: PersonCareOverviewInput): PersonCareOverviewView {
  const contextLabel = contactContextLabel(input);

  if (input.openSignalsCount > 0) {
    return {
      priorityTone: input.hasRiskSignal ? "risk" : "warn",
      signalLabel: input.hasRiskSignal ? "Urgente" : "Em atenção",
      contextLabel,
      nextStepLabel: input.canRegisterCare ? "Guardar contato pastoral" : "Alinhar com a liderança",
      nextStepDetail: input.hasPhone
        ? "Depois de ligação, WhatsApp ou conversa pessoal, o cuidado pode ser guardado aqui."
        : "Sem telefone cadastrado. Um cuidado que já aconteceu fora do app ainda pode ser guardado aqui.",
      actionLabel: input.canRegisterCare ? "Guardar cuidado" : "Ver contexto",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  if (input.isInCare) {
    return {
      priorityTone: "care",
      signalLabel: "Em cuidado",
      contextLabel,
      nextStepLabel: input.canRegisterCare ? "Atualizar acompanhamento" : "Consultar histórico",
      nextStepDetail: "O histórico ajuda antes de registrar outro contato ou encerrar o destaque pastoral.",
      actionLabel: input.canRegisterCare ? "Atualizar cuidado" : "Mostrar histórico completo",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  return {
    priorityTone: "muted",
    signalLabel: "Estável",
    contextLabel,
    nextStepLabel: input.canRegisterCare ? "Guardar cuidado quando houver" : "Consultar contexto",
    nextStepDetail: input.hasPhone
      ? "Este espaço fica para ligação, WhatsApp, conversa ou anotação pastoral que já aconteceu."
      : "Sem telefone cadastrado. Um cuidado que já aconteceu ainda pode ser guardado manualmente.",
    actionLabel: input.canRegisterCare ? "Guardar cuidado" : "Ver contexto",
    actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
  };
}

function contactContextLabel(input: Pick<PersonCareOverviewInput, "assignedActorName" | "primaryLeadershipName" | "primaryGroupName">): string {
  const actorName = input.assignedActorName || input.primaryLeadershipName;
  return actorName ? `${actorName} · ${input.primaryGroupName}` : input.primaryGroupName;
}
