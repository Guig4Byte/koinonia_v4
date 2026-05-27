import type { CareKind } from "@/generated/prisma/client";

export type CareContactMethod = "call" | "whatsapp" | "existing";

export const CARE_COPY = {
  errors: {
    invalidPayload: "Dados de cuidado inválidos",
    personNotFound: "Irmão não encontrado",
    noPermission: "Sem permissão para registrar cuidado",
    noUpdatePermission: "Este irmão não está disponível para atualização no seu acesso",
    noVisibleGroup: "Sem célula visível para registrar este cuidado",
    registerFallback: "Não foi possível registrar o cuidado agora.",
    markActiveFallback: "Não foi possível encerrar o cuidado agora.",
  },

  feedback: {
    contactDone: "Cuidado registrado.",
    contactDoneWithNote: "Cuidado registrado com anotação.",
    callDone: "Ligação registrada.",
    callDoneWithNote: "Ligação registrada com anotação.",
    whatsappDone: "WhatsApp registrado.",
    whatsappDoneWithNote: "WhatsApp registrado com anotação.",
    recentCareRegistered: "Cuidado recente guardado.",
    noFormalFollowUp: "O cuidado ficou em dia sem abrir um acompanhamento formal.",
    noAttentionChanged: "Nenhum sinal de atenção mudou agora.",
    careRegisteredAndPersonInCare: "Cuidado registrado. O irmão segue em cuidado.",
    personInCareSuffix: "O irmão segue em cuidado.",
  },

  history: {
    empty: "Nenhum cuidado registrado ainda. Quando houver um contato real, ele pode ser guardado em “Guardar contato pastoral”.",
  },

  statusActions: {
    title: "Este irmão está em cuidado.",
    description: "Para quando o irmão respondeu bem ao contato ou não precisa mais ficar em destaque.",
    confirmLabel: "Sim, encerrar cuidado",
    keepInCareLabel: "Manter em cuidado",
    startLabel: "Encerrar cuidado",
    openSignalInVisibleScope: "Ainda há motivo de atenção aberto para este irmão. O cuidado precisa ser registrado antes de encerrar o acompanhamento.",
    openSignalOutsideScope: "Ainda há motivo de atenção aberto fora do seu recorte atual. O apoio da supervisão ajuda antes de encerrar o acompanhamento.",
  },

  contactActions: {
    callLabel: "Ligar",
    whatsappLabel: "WhatsApp",
    existingContactLabel: "Guardar cuidado",
    noPhoneTitle: "Sem telefone cadastrado",
    noPhoneDescription: "Um telefone cadastrado depois libera ligação e WhatsApp. Por enquanto, apenas um cuidado que já aconteceu pode ser guardado.",
    registerWithoutPhoneLabel: "Guardar cuidado já realizado",
  },

  confirmContact: {
    title: "O contato aconteceu?",
    callTitle: "Conseguiu falar por ligação?",
    whatsappTitle: "Conseguiu conversar pelo WhatsApp?",
    description: "Nada será salvo se ainda não houve contato com o irmão.",
    callDescription: "A ligação só será salva se aconteceu de fato. Se ainda não houve contato, pode voltar sem salvar.",
    whatsappDescription: "O WhatsApp só será salvo se houve conversa real. Se a mensagem ficou sem resposta, pode voltar sem salvar.",
    confirmLabel: "Sim, houve contato",
    callConfirmLabel: "Sim, falei por ligação",
    whatsappConfirmLabel: "Sim, conversei",
    cancelLabel: "Ainda não",
  },

  confirmExistingContact: {
    title: "O cuidado já aconteceu?",
    description: "Para quando a ligação, mensagem ou conversa já aconteceu fora do Koinonia. Na próxima etapa, uma anotação pode ser adicionada antes de salvar.",
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
