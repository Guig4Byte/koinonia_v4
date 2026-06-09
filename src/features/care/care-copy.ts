import type { CareKind } from "@/generated/prisma/client";

export type CareContactMethod = "call" | "whatsapp" | "existing";

export const CARE_COPY = {
  errors: {
    invalidPayload: "Não foi possível ler os dados deste cuidado.",
    invalidPhonePayload: "Não foi possível ler o telefone informado.",
    personNotFound: "Irmão não encontrado",
    noPermission: "Este cuidado não está disponível no seu acesso",
    noUpdatePermission: "Este irmão não está disponível para atualização no seu acesso",
    noVisibleGroup: "Não há célula visível no seu acesso para guardar este cuidado",
    registerFallback: "Não foi possível registrar o cuidado agora. Vale tentar novamente em instantes.",
    markActiveFallback: "Não foi possível encerrar o cuidado agora. Vale tentar novamente em instantes.",
    phoneUpdateFallback: "Não foi possível salvar o telefone agora. Vale tentar novamente em instantes.",
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
    phoneSaved: "Telefone salvo.",
  },

  history: {
    empty: "Nenhum cuidado registrado ainda. Quando houver um contato real, ele pode ser guardado em “Guardar contato pastoral”.",
  },

  statusActions: {
    title: "Este irmão está em cuidado.",
    description: "Quando o irmão respondeu bem ao contato ou não precisa continuar em destaque.",
    confirmLabel: "Sim, encerrar cuidado",
    keepInCareLabel: "Manter em cuidado",
    startLabel: "Encerrar cuidado",
    openSignalInVisibleScope: "Ainda há motivo de atenção aberto para este irmão. Antes de encerrar o acompanhamento, esse cuidado precisa ser registrado.",
    openSignalOutsideScope: "Ainda há motivo de atenção aberto fora do seu recorte atual. A supervisão pode ajudar antes de encerrar o acompanhamento.",
  },

  contactActions: {
    phoneLabel: "Telefone",
    callLabel: "Ligar",
    whatsappLabel: "WhatsApp",
    whatsappHint: "Abre com uma mensagem pastoral pronta. Depois do contato real, confirme para guardar no histórico.",
    existingContactLabel: "Guardar cuidado",
    noPhoneTitle: "Sem telefone cadastrado",
    noPhoneDescription: "Quando um telefone for cadastrado, ligação e WhatsApp ficam disponíveis. Por enquanto, um cuidado já realizado ainda pode ser guardado.",
    registerWithoutPhoneLabel: "Guardar cuidado já realizado",
    addPhoneLabel: "Adicionar telefone",
    editPhoneLabel: "Editar telefone",
  },

  phoneForm: {
    title: "Adicionar telefone",
    editTitle: "Editar telefone",
    description: "O telefone fica no perfil da pessoa e libera WhatsApp e ligação no cuidado pastoral.",
    label: "Telefone de contato",
    placeholder: "(00) 00000-0000",
    saveLabel: "Salvar telefone",
    savingLabel: "Salvando...",
    cancelLabel: "Cancelar",
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
    description: "Quando a ligação, mensagem ou conversa já aconteceu fora do Koinonia, uma anotação pode ser adicionada antes de salvar.",
    confirmLabel: "Sim, já houve",
    cancelLabel: "Cancelar",
  },

  notePrompt: {
    title: "Quer deixar uma anotação?",
    description: "Mesmo sem anotação, o cuidado fica guardado no histórico pastoral.",
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
  ESCALATED_TO_PASTOR: "Encaminhado ao pastor",
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
    if (resolvedSignalsCount === 1) return `1 sinal de atenção foi cuidado. ${CARE_COPY.feedback.personInCareSuffix}`;
    if (resolvedSignalsCount > 1) return `${resolvedSignalsCount} sinais de atenção foram cuidados. ${CARE_COPY.feedback.personInCareSuffix}`;
    return CARE_COPY.feedback.careRegisteredAndPersonInCare;
  }

  if (resolvedSignalsCount <= 0) return CARE_COPY.feedback.noAttentionChanged;
  if (resolvedSignalsCount === 1) return "1 sinal de atenção foi cuidado.";
  return `${resolvedSignalsCount} sinais de atenção foram cuidados.`;
}
