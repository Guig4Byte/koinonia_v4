type SignalDisplayViewerLike = {
  role: string;
};

function isSignalCopyPastoralRole(viewer: { role: string }) {
  return viewer.role === "PASTOR" || viewer.role === "ADMIN";
}

type SignalPastoralMessage = {
  title: string;
  description?: string;
};

type SignalSupportFormStage = "request-supervisor" | "escalate-pastor";

type SignalSupportActionCopy = {
  action: "REQUEST_SUPERVISOR" | "ESCALATE_PASTOR";
  title: string;
  detail: string;
  label: string;
};

export const SIGNAL_COPY = {
  errors: {
    invalidSupportRequest: "Pedido de apoio inválido",
    signalNotFound: "Sinal não encontrado",
    noCarePermission: "Sem permissão para este cuidado",
    leaderOnlySupervisorRequest: "Apenas o líder da célula pode pedir apoio à supervisão",
    noSupervisor: "Esta célula ainda não tem supervisor definido",
    leaderOrSupervisorOnlyPastoralEscalation: "Apenas liderança ou supervisão da célula pode encaminhar este caso ao pastor",
    noPastoralAssignee: "Nenhum pastor/admin disponível para encaminhamento pastoral",
    supportFallback: "Não foi possível pedir apoio agora.",
  },

  support: {
    requested: {
      label: "Apoio solicitado",
      supervisorLabel: "Pedido de apoio",
      detail: "Apoio solicitado à supervisão.",
      supervisorDetail: "Essa célula pediu apoio da supervisão.",
      apiMessage: "Apoio solicitado à supervisão.",
      receivedTitle: "Pedido de apoio recebido.",
      receivedDescription: "A liderança pediu ajuda para acompanhar este cuidado com mais proximidade.",
      leaderTitle: "Apoio solicitado à supervisão.",
      leaderDescription: "Você continua perto da pessoa, com a supervisão caminhando junto.",
      contextTitle: "Apoio em andamento.",
      contextDescription: "Esse cuidado segue com liderança e supervisão; aparece aqui apenas como contexto da célula.",
      rawLeaderReason: "Líder pediu apoio da supervisão",
      leaderReasonReplacement: "Apoio solicitado à supervisão",
    },
    form: {
      notePlaceholder: "Ex.: Tentei contato, mas ainda não consegui falar.",
      noteLabel: "Contexto opcional",
      cancelLabel: "Cancelar",
      savingLabel: "Salvando...",
    },
    requestSupervisor: {
      title: "Pedir apoio à supervisão?",
      detail: "A liderança continua acompanhando, mas a supervisão também verá este cuidado.",
      label: "Pedir apoio",
      startLabel: "Pedir apoio",
    },
    escalatePastor: {
      title: "Encaminhar ao pastor?",
      detail: "Use quando este cuidado pedir um olhar pastoral mais próximo ou envolver algo sensível.",
      detailWithSupervisorOption: "O pastor pode ser envolvido quando este cuidado pedir um olhar pastoral mais próximo ou envolver algo sensível. A supervisão também está disponível como apoio, quando ajudar no discernimento.",
      label: "Encaminhar",
      startLabel: "Encaminhar ao pastor",
    },
    guidance: {
      both: "Quando desejar apoio no cuidado, você pode contar com a supervisão. O pastor pode ser envolvido quando a situação pedir um olhar pastoral mais próximo ou envolver algo sensível.",
      supervisorOnly: "O apoio à supervisão ajuda quando o próximo gesto pede outra liderança. A responsabilidade local continua simples.",
      pastorOnly: "O encaminhamento ao pastor fica para cuidados que pedem um olhar pastoral mais próximo ou envolvem algo sensível.",
    },
    pulse: {
      leaderSingleTitle: "Apoio solicitado à supervisão.",
      leaderPluralTitle: "Há apoios solicitados à supervisão.",
      leaderGroupSubtitle: "Você continua perto da célula, com a supervisão caminhando junto.",
      leaderDashboardSubtitle: "Você continua perto das pessoas, com a supervisão caminhando junto.",
      supervisorGroupSingleTitle: "Esta célula pediu apoio da supervisão.",
      supervisorGroupPluralTitle: "Há pedidos de apoio nesta célula.",
      supervisorGroupSubtitle: "Veja o contexto e caminhe junto com a liderança.",
      supervisorPersonTitle: (personName: string) => `${personName} tem um pedido de apoio da supervisão.`,
      supervisorPersonSubtitle: (prefix: string) => `${prefix}apoie a liderança com calma, sem assumir a operação da célula.`,
      supervisorDashboardTitle: (count: number) => `${count} pedidos de apoio chegaram à supervisão.`,
      supervisorDashboardSubtitle: "Veja o contexto de cada célula e apoie a liderança com calma.",
      inProgressGroupTitle: "Há apoio em andamento nesta célula.",
      inProgressDashboardTitle: "Há apoio em andamento.",
      inProgressGroupSubtitle: "Esse cuidado segue com liderança e supervisão.",
    },
  },

  pastoralEscalation: {
    label: "Encaminhado ao pastor",
    detail: "Encaminhado ao pastor.",
    pastoralDetail: "Encaminhado ao cuidado pastoral.",
    chip: "Encaminhado",
    pastoralChip: "Cuidado pastoral",
    apiMessage: "Encaminhado ao pastor.",
    title: "Encaminhado ao pastor.",
    requestedTitle: "Cuidado pastoral solicitado.",
    requestedDescriptionWithActor: (actorName: string) => `${actorName} compartilhou este cuidado para um olhar mais próximo. Um contato pode ajudar a entender melhor o momento.`,
    requestedDescription: "Há um contexto que pede um olhar mais próximo.",
    leaderDescription: "Você compartilhou este cuidado para um olhar pastoral mais próximo.",
    teamDescription: "Esse cuidado foi compartilhado para acompanhamento pastoral.",
  },

  badges: {
    urgent: "Urgente",
    localAttention: "Atenção local",
    supportRequest: "Pedido de apoio",
    pastoralCase: "Caso pastoral",
    escalated: "Encaminhado",
    informational: "Informativo",
    attention: "Em atenção",
  },

  messages: {
    attendanceRecurring: {
      title: "Urgência percebida.",
      evidenceFallback: "Presença recente entrou em urgência.",
      compact: "Parece que houve ausências recorrentes sem justificativa registrada.",
      pastoralDetail: "Parece que houve ausências recorrentes sem justificativa registrada. A presença recente pede um olhar pastoral mais próximo, com calma e contexto.",
      localDetail: "Parece que houve ausências recorrentes sem justificativa registrada. Talvez valha uma aproximação simples, com calma e proximidade.",
    },
    attendanceRecent: {
      title: "Atenção percebida",
      evidenceFallback: "Presença recente entrou em atenção.",
      compact: "Parece que houve ausências sem justificativa registrada.",
      leaderDetail: "Parece que houve ausências sem justificativa registrada. Talvez valha uma aproximação simples, sem tom de cobrança.",
      teamDetail: "Parece que houve ausências sem justificativa registrada. Pode ser um bom ponto de atenção para acompanhar com calma.",
    },
    urgent: {
      title: "Urgência percebida.",
      pastoralDescription: "Há um sinal sensível que vale olhar com calma antes de orientar a equipe.",
      localDescription: "Há um sinal sensível que vale acompanhar com calma e proximidade.",
    },
    noContact: {
      title: "Vínculo pede proximidade.",
      description: "Pode ser um bom momento para retomar contato com calma.",
    },
    visitor: {
      title: "Pessoa para acolher com proximidade.",
      description: "Vale manter esse vínculo no radar com leveza.",
    },
    attention: {
      title: "Atenção percebida",
      description: "Há um contexto que vale acompanhar com calma.",
    },
    informational: {
      title: "Informativo.",
      description: "Há um registro para contexto deste cuidado.",
    },
  },
} as const;

export function supervisorEscalationCopy(viewer: { role: string }) {
  const isSupervisorViewer = viewer.role === "SUPERVISOR";

  return {
    label: isSupervisorViewer ? SIGNAL_COPY.support.requested.supervisorLabel : SIGNAL_COPY.support.requested.label,
    detail: isSupervisorViewer ? SIGNAL_COPY.support.requested.supervisorDetail : SIGNAL_COPY.support.requested.detail,
    chip: isSupervisorViewer ? SIGNAL_COPY.support.requested.supervisorLabel : SIGNAL_COPY.support.requested.label,
  };
}

export function pastoralEscalationCopy(viewer: { role: string }) {
  const isPastoralRoleViewer = isSignalCopyPastoralRole(viewer);

  return {
    label: SIGNAL_COPY.pastoralEscalation.label,
    detail: isPastoralRoleViewer ? SIGNAL_COPY.pastoralEscalation.pastoralDetail : SIGNAL_COPY.pastoralEscalation.detail,
    chip: isPastoralRoleViewer ? SIGNAL_COPY.pastoralEscalation.pastoralChip : SIGNAL_COPY.pastoralEscalation.chip,
  };
}

export function supportPastoralMessageCopy(viewer: SignalDisplayViewerLike): SignalPastoralMessage {
  if (viewer.role === "SUPERVISOR") {
    return {
      title: SIGNAL_COPY.support.requested.receivedTitle,
      description: SIGNAL_COPY.support.requested.receivedDescription,
    };
  }

  if (viewer.role === "LEADER") {
    return {
      title: SIGNAL_COPY.support.requested.leaderTitle,
      description: SIGNAL_COPY.support.requested.leaderDescription,
    };
  }

  return {
    title: SIGNAL_COPY.support.requested.contextTitle,
    description: SIGNAL_COPY.support.requested.contextDescription,
  };
}

export function signalSupportActionCopyForStageCopy(
  stage: SignalSupportFormStage,
  options: { canRequestSupervisor: boolean },
): SignalSupportActionCopy {
  if (stage === "request-supervisor") {
    return {
      action: "REQUEST_SUPERVISOR",
      title: SIGNAL_COPY.support.requestSupervisor.title,
      detail: SIGNAL_COPY.support.requestSupervisor.detail,
      label: SIGNAL_COPY.support.requestSupervisor.label,
    };
  }

  return {
    action: "ESCALATE_PASTOR",
    title: SIGNAL_COPY.support.escalatePastor.title,
    detail: options.canRequestSupervisor
      ? SIGNAL_COPY.support.escalatePastor.detailWithSupervisorOption
      : SIGNAL_COPY.support.escalatePastor.detail,
    label: SIGNAL_COPY.support.escalatePastor.label,
  };
}

export function signalSupportGuidanceCopy(canRequestSupervisor: boolean, canEscalatePastor: boolean) {
  if (canRequestSupervisor && canEscalatePastor) return SIGNAL_COPY.support.guidance.both;
  if (canRequestSupervisor) return SIGNAL_COPY.support.guidance.supervisorOnly;
  if (canEscalatePastor) return SIGNAL_COPY.support.guidance.pastorOnly;
  return null;
}
