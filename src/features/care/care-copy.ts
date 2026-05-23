import type { CareKind } from "@/generated/prisma/client";

export type CareContactMethod = "call" | "whatsapp" | "existing";

export const CARE_COPY = {
  errors: {
    invalidPayload: "Dados de cuidado inválidos",
    personNotFound: "Pessoa não encontrada",
    noPermission: "Sem permissão para registrar cuidado",
    noUpdatePermission: "Sem permissão para atualizar esta pessoa",
    noVisibleGroup: "Sem célula visível para registrar este cuidado",
    registerFallback: "Não foi possível registrar o cuidado agora.",
    markActiveFallback: "Não foi possível marcar como ativo agora.",
  },

  feedback: {
    contactDone: "Cuidado registrado.",
    contactDoneWithNote: "Cuidado registrado com anotação.",
    callDone: "Ligação registrada.",
    callDoneWithNote: "Ligação registrada com anotação.",
    whatsappDone: "WhatsApp registrado.",
    whatsappDoneWithNote: "WhatsApp registrado com anotação.",
    recentCareRegistered: "Registrado no cuidado recente.",
    noFormalFollowUp: "A atenção ficou em dia sem criar acompanhamento formal.",
    noAttentionChanged: "Nenhum motivo de atenção foi alterado.",
    careRegisteredAndPersonInCare: "Cuidado registrado. Pessoa ficou em cuidado.",
    personInCareSuffix: "Pessoa ficou em cuidado.",
  },

  history: {
    empty: "Nenhum cuidado registrado ainda. Use “Guardar contato pastoral” quando houver um contato real para guardar.",
  },

  statusActions: {
    title: "Esta pessoa está em cuidado.",
    description: "Use quando a pessoa respondeu bem ao contato ou quando não precisa mais ficar em destaque.",
    confirmLabel: "Sim, marcar como ativo",
    keepInCareLabel: "Manter em cuidado",
    startLabel: "Marcar como ativo",
    openSignalInVisibleScope: "Ainda há motivo de atenção aberto para esta pessoa. Registre o cuidado antes de marcar como ativo.",
    openSignalOutsideScope: "Ainda há motivo de atenção aberto fora do seu recorte atual. Peça apoio antes de marcar como ativo.",
  },

  contactActions: {
    callLabel: "Ligar",
    whatsappLabel: "WhatsApp",
    existingContactLabel: "Guardar contato pastoral",
    noPhoneTitle: "Sem telefone cadastrado",
    noPhoneDescription: "Cadastre um telefone depois para liberar ligação e WhatsApp. Por enquanto, guarde apenas um cuidado que já aconteceu.",
    registerWithoutPhoneLabel: "Guardar cuidado já realizado",
  },

  confirmContact: {
    title: "O contato aconteceu?",
    callTitle: "Conseguiu falar por ligação?",
    whatsappTitle: "Conseguiu conversar pelo WhatsApp?",
    description: "Nada será salvo se você ainda não conseguiu falar com a pessoa.",
    callDescription: "Salve a ligação somente se ela aconteceu de fato. Se ainda não conseguiu falar, volte sem salvar.",
    whatsappDescription: "Salve o WhatsApp somente se houve conversa real. Se a mensagem ficou sem resposta, volte sem salvar.",
    confirmLabel: "Sim, houve contato",
    callConfirmLabel: "Sim, falei por ligação",
    whatsappConfirmLabel: "Sim, conversei",
    cancelLabel: "Ainda não",
  },

  confirmExistingContact: {
    title: "O cuidado já aconteceu?",
    description: "Use quando você já ligou, mandou mensagem ou conversou fora do Koinonia. Na próxima etapa, escolha se quer anotar algo antes de salvar.",
    confirmLabel: "Sim, já houve",
    cancelLabel: "Cancelar",
  },

  notePrompt: {
    title: "Quer deixar uma anotação?",
    description: "Salvar sem anotação também guarda o cuidado e mantém o histórico pastoral coerente.",
    addNoteLabel: "Anotar",
    saveWithoutNoteLabel: "Salvar sem anotação",
    cancelLabel: "Cancelar por enquanto",
  },

  noteForm: {
    label: "Observação opcional",
    placeholder: "Ex.: Orei com ele. Está melhor. Pediu ajuda pela família.",
    backLabel: "Voltar",
    saveLabel: "Salvar cuidado",
    savingLabel: "Salvando...",
  },
} as const;

export const careKindLabels: Record<CareKind, string> = {
  CALL: "Ligação registrada",
  WHATSAPP: "WhatsApp registrado",
  VISIT: "Visita registrada",
  PRAYER: "Oração registrada",
  MARKED_CARED: CARE_COPY.feedback.contactDone,
  NOTE: "Anotação",
  REQUESTED_SUPPORT: "Pedido de apoio à supervisão",
  ESCALATED_TO_PASTOR: "Encaminhado ao cuidado pastoral",
};

export function careConfirmContactCopy(method?: CareContactMethod) {
  if (method === "call") {
    return {
      title: CARE_COPY.confirmContact.callTitle,
      description: CARE_COPY.confirmContact.callDescription,
      confirmLabel: CARE_COPY.confirmContact.callConfirmLabel,
      cancelLabel: CARE_COPY.confirmContact.cancelLabel,
    };
  }

  if (method === "whatsapp") {
    return {
      title: CARE_COPY.confirmContact.whatsappTitle,
      description: CARE_COPY.confirmContact.whatsappDescription,
      confirmLabel: CARE_COPY.confirmContact.whatsappConfirmLabel,
      cancelLabel: CARE_COPY.confirmContact.cancelLabel,
    };
  }

  return {
    title: CARE_COPY.confirmContact.title,
    description: CARE_COPY.confirmContact.description,
    confirmLabel: CARE_COPY.confirmContact.confirmLabel,
    cancelLabel: CARE_COPY.confirmContact.cancelLabel,
  };
}

export function careSavedMessage(hasNote: boolean, method?: CareContactMethod) {
  if (method === "call") return hasNote ? CARE_COPY.feedback.callDoneWithNote : CARE_COPY.feedback.callDone;
  if (method === "whatsapp") return hasNote ? CARE_COPY.feedback.whatsappDoneWithNote : CARE_COPY.feedback.whatsappDone;
  return hasNote ? CARE_COPY.feedback.contactDoneWithNote : CARE_COPY.feedback.contactDone;
}

export function resolvedAttentionMessage(resolvedSignalsCount: number, personStatusChangedToCare = false) {
  if (personStatusChangedToCare) {
    if (resolvedSignalsCount === 1) return `1 motivo de atenção foi cuidado. ${CARE_COPY.feedback.personInCareSuffix}`;
    if (resolvedSignalsCount > 1) return `${resolvedSignalsCount} motivos de atenção foram cuidados. ${CARE_COPY.feedback.personInCareSuffix}`;
    return CARE_COPY.feedback.careRegisteredAndPersonInCare;
  }

  if (resolvedSignalsCount <= 0) return CARE_COPY.feedback.noAttentionChanged;
  if (resolvedSignalsCount === 1) return "1 motivo de atenção foi cuidado.";
  return `${resolvedSignalsCount} motivos de atenção foram cuidados.`;
}
