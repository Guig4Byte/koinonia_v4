import type { CareKind } from "@/generated/prisma/client";

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
    contactDone: "Contato feito.",
    contactDoneWithNote: "Contato feito com anotação.",
    recentCareRegistered: "Registrado no cuidado recente.",
    noFormalFollowUp: "A atenção ficou em dia sem criar acompanhamento formal.",
    noAttentionChanged: "Nenhum motivo de atenção foi alterado.",
    careRegisteredAndPersonInCare: "Cuidado registrado. Pessoa ficou em cuidado.",
    personInCareSuffix: "Pessoa ficou em cuidado.",
  },

  history: {
    empty: "Nenhum cuidado registrado ainda. Use “Já houve contato?” quando houver um contato real para guardar.",
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
    existingContactLabel: "Já houve contato?",
  },

  confirmContact: {
    title: "O contato aconteceu?",
    description: "Nada será registrado se você ainda não conseguiu falar com a pessoa.",
    confirmLabel: "Sim, houve contato",
    cancelLabel: "Ainda não",
  },

  confirmExistingContact: {
    title: "O cuidado já aconteceu?",
    description: "Use quando você já ligou, mandou mensagem ou conversou fora do Koinonia. A atenção só será fechada depois da próxima confirmação.",
    confirmLabel: "Sim, já houve",
    cancelLabel: "Cancelar",
  },

  notePrompt: {
    title: "Quer deixar uma anotação?",
    description: "Salvar sem anotação também registra o cuidado e mantém a pessoa no radar certo.",
    addNoteLabel: "Anotar",
    saveWithoutNoteLabel: "Salvar sem anotação",
    cancelLabel: "Cancelar e não registrar agora",
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
  CALL: CARE_COPY.feedback.contactDone,
  WHATSAPP: CARE_COPY.feedback.contactDone,
  VISIT: CARE_COPY.feedback.contactDone,
  PRAYER: CARE_COPY.feedback.contactDone,
  MARKED_CARED: CARE_COPY.feedback.contactDone,
  NOTE: "Anotação",
  REQUESTED_SUPPORT: "Pedido de apoio à supervisão",
  ESCALATED_TO_PASTOR: "Encaminhado ao cuidado pastoral",
};

export function careSavedMessage(hasNote: boolean) {
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
