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
      signalLabel: input.hasRiskSignal ? "Cuidado próximo" : "Em atenção",
      contextLabel,
      nextStepLabel: input.canRegisterCare ? "Guardar contato pastoral" : "Alinhar com a liderança",
      nextStepDetail: input.hasPhone
        ? "Converse por ligação, WhatsApp ou pessoalmente; depois guarde o cuidado."
        : "Sem telefone cadastrado. Guarde apenas um cuidado que já aconteceu fora do app.",
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
      nextStepDetail: "Revise o histórico antes de guardar outro contato ou encerrar o destaque pastoral.",
      actionLabel: input.canRegisterCare ? "Atualizar cuidado" : "Mostrar histórico completo",
      actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
    };
  }

  return {
    priorityTone: "muted",
    signalLabel: "Estável",
    contextLabel,
    nextStepLabel: input.canRegisterCare ? "Guardar quando houver cuidado" : "Consultar contexto",
    nextStepDetail: input.hasPhone
      ? "Guarde aqui somente depois de ligação, WhatsApp, conversa ou anotação pastoral relevante."
      : "Sem telefone cadastrado. Ainda dá para guardar cuidado real manualmente.",
    actionLabel: input.canRegisterCare ? "Guardar cuidado" : "Ver contexto",
    actionHref: input.canRegisterCare ? "#registrar-cuidado" : "#historico-cuidado",
  };
}

function contactContextLabel(input: Pick<PersonCareOverviewInput, "assignedActorName" | "primaryLeadershipName" | "primaryGroupName">): string {
  const actorName = input.assignedActorName || input.primaryLeadershipName;
  return actorName ? `${actorName} · ${input.primaryGroupName}` : input.primaryGroupName;
}
