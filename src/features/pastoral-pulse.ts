import { UserRole } from "../generated/prisma/client";

export type PastoralPulseTone = "calm" | "attention" | "ok";

export type PastoralPulseScope = "leaderDashboard" | "supervisorDashboard" | "pastorDashboard" | "groupDetail";

export type PastoralPulseCounts = {
  urgentOrPastoral?: number;
  support?: number;
  attention?: number;
  inCare?: number;
  hasPendingEvent?: boolean;
  hasRecentPresence?: boolean;
  presenceRate?: number;
};

export type PastoralPulseSubject = {
  personName?: string;
  groupName?: string;
  detail?: string;
};

export type PastoralPulseSubjects = {
  urgentOrPastoral?: PastoralPulseSubject | null;
  support?: PastoralPulseSubject | null;
  attention?: PastoralPulseSubject | null;
  inCare?: PastoralPulseSubject | null;
};

export type PastoralPulseMessage = {
  title: string;
  subtitle: string;
  tone: PastoralPulseTone;
};

function count(value: number | undefined): number {
  return value ?? 0;
}

function isPastorRole(role: UserRole): boolean {
  return role === UserRole.PASTOR || role === UserRole.ADMIN;
}

function groupPrefix(subject?: PastoralPulseSubject | null): string {
  return subject?.groupName ? `${subject.groupName}: ` : "";
}

function activeCareCategories({ urgentOrPastoral, support, attention, inCare }: Required<Pick<PastoralPulseCounts, "urgentOrPastoral" | "support" | "attention" | "inCare">>): number {
  return [urgentOrPastoral, support, attention, inCare].filter((value) => value > 0).length;
}

function totalCareCount({ urgentOrPastoral, support, attention, inCare }: Required<Pick<PastoralPulseCounts, "urgentOrPastoral" | "support" | "attention" | "inCare">>): number {
  return urgentOrPastoral + support + attention + inCare;
}

function mixedCareMessage(role: UserRole, scope: PastoralPulseScope, urgentOrPastoral: number): PastoralPulseMessage {
  if (scope === "pastorDashboard") {
    return {
      title: "Há cuidados com prioridades diferentes.",
      subtitle: "Os casos sensíveis aparecem primeiro; os demais seguem com líderes e supervisores.",
      tone: "attention",
    };
  }

  if (scope === "groupDetail") {
    if (isPastorRole(role)) {
      return {
        title: "Há cuidados com prioridades diferentes nesta célula.",
        subtitle: "Os sinais mais sensíveis aparecem primeiro; os demais seguem com líderes e supervisores.",
        tone: "attention",
      };
    }

    if (role === UserRole.SUPERVISOR) {
      return {
        title: "Há cuidados em momentos diferentes nesta célula.",
        subtitle: "Veja os sinais com calma e caminhe junto com a liderança.",
        tone: "attention",
      };
    }

    return {
      title: "Há cuidados com prioridades diferentes nesta célula.",
      subtitle: "Olhe primeiro os sinais mais sensíveis e acompanhe os demais com calma.",
      tone: "attention",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    return {
      title: "Há cuidados em momentos diferentes.",
      subtitle: urgentOrPastoral > 0
        ? "Comece pelos sinais mais sensíveis e caminhe junto com a liderança."
        : "Alguns pedem apoio da supervisão, outros seguem como atenção local.",
      tone: "attention",
    };
  }

  return {
    title: "Há cuidados com prioridades diferentes.",
    subtitle: urgentOrPastoral > 0
      ? "Olhe primeiro os sinais mais sensíveis e mantenha os demais no radar."
      : "Alguns pedem uma aproximação simples, outros seguem em cuidado.",
    tone: "attention",
  };
}

function urgentMessage(
  role: UserRole,
  scope: PastoralPulseScope,
  urgentOrPastoral: number,
  subject?: PastoralPulseSubject | null,
): PastoralPulseMessage {
  if (scope === "pastorDashboard") {
    if (urgentOrPastoral === 1 && subject?.personName) {
      return {
        title: `${subject.personName} pede um olhar pastoral mais próximo.`,
        subtitle: "Veja o contexto com calma antes de orientar a equipe.",
        tone: "attention",
      };
    }

    return {
      title: `${urgentOrPastoral} irmãos pedem um olhar pastoral mais próximo.`,
      subtitle: "Há sinais sensíveis aqui. Veja com calma antes de orientar a equipe.",
      tone: "attention",
    };
  }

  if (scope === "groupDetail") {
    if (role === UserRole.LEADER) {
      return {
        title: urgentOrPastoral === 1
          ? "Há um cuidado que pede proximidade."
          : `${urgentOrPastoral} cuidados pedem proximidade nesta célula.`,
        subtitle: "Olhe os sinais com calma e peça apoio se precisar.",
        tone: "attention",
      };
    }

    return {
      title: urgentOrPastoral === 1
        ? "Há um cuidado sensível nesta célula."
        : "Há cuidados sensíveis nesta célula.",
      subtitle: isPastorRole(role)
        ? "Algumas pessoas podem precisar de um olhar pastoral mais próximo."
        : "Acompanhe a liderança e veja onde o cuidado precisa de apoio.",
      tone: "attention",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    if (urgentOrPastoral === 1 && subject?.personName) {
      return {
        title: `${subject.personName} pede cuidado mais próximo.`,
        subtitle: `${groupPrefix(subject)}caminhe com a liderança nesse cuidado, sem assumir a operação da célula.`,
        tone: "attention",
      };
    }

    return {
      title: `${urgentOrPastoral} irmãos pedem cuidado mais próximo.`,
      subtitle: "Há sinais sensíveis aqui. Veja os casos com calma e caminhe junto com a liderança.",
      tone: "attention",
    };
  }

  if (urgentOrPastoral === 1 && subject?.personName) {
    return {
      title: `${subject.personName} pede cuidado mais próximo.`,
      subtitle: subject.detail ?? "Vale uma aproximação com calma e proximidade.",
      tone: "attention",
    };
  }

  return {
    title: `${urgentOrPastoral} irmãos pedem cuidado mais próximo.`,
    subtitle: "Há sinais sensíveis aqui. Abra as pessoas e acompanhe cada cuidado com calma.",
    tone: "attention",
  };
}

function supportMessage(
  role: UserRole,
  scope: PastoralPulseScope,
  support: number,
  subject?: PastoralPulseSubject | null,
): PastoralPulseMessage {
  if (scope === "groupDetail") {
    if (role === UserRole.LEADER) {
      return {
        title: support === 1 ? "Apoio solicitado à supervisão." : "Há apoios solicitados à supervisão.",
        subtitle: "Você continua perto da célula, com a supervisão caminhando junto.",
        tone: "attention",
      };
    }

    if (role === UserRole.SUPERVISOR) {
      return {
        title: support === 1
          ? "Esta célula pediu apoio da supervisão."
          : "Há pedidos de apoio nesta célula.",
        subtitle: "Veja o contexto e caminhe junto com a liderança.",
        tone: "attention",
      };
    }

    return {
      title: "Há apoio em andamento nesta célula.",
      subtitle: "Esse cuidado segue com liderança e supervisão.",
      tone: "calm",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    if (support === 1 && subject?.personName) {
      return {
        title: `${subject.personName} precisa de apoio da supervisão.`,
        subtitle: `${groupPrefix(subject)}apoie a liderança com calma, sem assumir a operação da célula.`,
        tone: "attention",
      };
    }

    return {
      title: `${support} pedidos de apoio chegaram à supervisão.`,
      subtitle: "Veja o contexto de cada célula e apoie a liderança com calma.",
      tone: "attention",
    };
  }

  if (role === UserRole.LEADER) {
    return {
      title: support === 1 ? "Apoio solicitado à supervisão." : "Há apoios solicitados à supervisão.",
      subtitle: "Você continua perto das pessoas, com a supervisão caminhando junto.",
      tone: "attention",
    };
  }

  return {
    title: "Há apoio em andamento.",
    subtitle: "Esse cuidado segue com liderança e supervisão.",
    tone: "calm",
  };
}

function attentionMessage(
  role: UserRole,
  scope: PastoralPulseScope,
  attention: number,
  subject?: PastoralPulseSubject | null,
): PastoralPulseMessage {
  if (scope === "groupDetail") {
    if (isPastorRole(role)) {
      return {
        title: "Há atenção local nesta célula.",
        subtitle: "Esse cuidado segue com líderes e supervisores.",
        tone: "calm",
      };
    }

    if (attention === 1) {
      return {
        title: "Uma pessoa pede acompanhamento mais próximo.",
        subtitle: role === UserRole.LEADER
          ? "Vale uma aproximação simples, sem tom de cobrança."
          : "A liderança segue cuidando, mas vale manter esta célula no radar.",
        tone: "attention",
      };
    }

    return {
      title: "Há pessoas para acompanhar de perto.",
      subtitle: role === UserRole.LEADER
        ? "Vale uma aproximação simples, sem tom de cobrança."
        : "A liderança segue cuidando, mas vale manter esta célula no radar.",
      tone: "attention",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    if (attention === 1 && subject?.personName) {
      return {
        title: `${subject.personName} merece um olhar mais próximo.`,
        subtitle: `${groupPrefix(subject)}${subject.detail ?? "vale acompanhar com calma junto da liderança."}`,
        tone: "attention",
      };
    }

    return {
      title: `${attention} irmãos pedem atenção nas células.`,
      subtitle: "Acompanhe com calma e veja onde a liderança pode precisar de apoio.",
      tone: "attention",
    };
  }

  if (attention === 1 && subject?.personName) {
    return {
      title: `${subject.personName} pede uma aproximação simples.`,
      subtitle: subject.detail ?? "Vale cuidar com proximidade, sem tom de cobrança.",
      tone: "attention",
    };
  }

  return {
    title: `${attention} irmãos pedem atenção.`,
    subtitle: "Vale uma aproximação simples, sem tom de cobrança.",
    tone: "attention",
  };
}

function inCareMessage(
  role: UserRole,
  scope: PastoralPulseScope,
  inCare: number,
  subject?: PastoralPulseSubject | null,
): PastoralPulseMessage {
  if (scope === "groupDetail") {
    return {
      title: inCare === 1
        ? "Uma pessoa segue em cuidado nesta célula."
        : "Há pessoas em cuidado nesta célula.",
      subtitle: role === UserRole.LEADER
        ? "Continue acompanhando com leveza, sem transformar cuidado em cobrança."
        : "Elas já receberam cuidado e seguem no radar com leveza.",
      tone: "ok",
    };
  }

  if (scope === "pastorDashboard") {
    return {
      title: inCare === 1 && subject?.personName
        ? `${subject.personName} segue acolhido em cuidado.`
        : "Há irmãos acolhidos em cuidado.",
      subtitle: "Eles já receberam cuidado e continuam no radar pastoral.",
      tone: "ok",
    };
  }

  if (inCare === 1 && subject?.personName) {
    return {
      title: `${subject.personName} segue em cuidado.`,
      subtitle: "Alguém já recebeu cuidado e continua no radar.",
      tone: "ok",
    };
  }

  return {
    title: `${inCare} irmãos seguem em cuidado.`,
    subtitle: "Eles já receberam cuidado e continuam no radar com leveza.",
    tone: "ok",
  };
}

function stableMessage(scope: PastoralPulseScope): PastoralPulseMessage {
  if (scope === "pastorDashboard") {
    return {
      title: "Nenhum caso pastoral urgente ou encaminhado agora.",
      subtitle: "A atenção local segue com líderes e supervisores.",
      tone: "ok",
    };
  }

  if (scope === "supervisorDashboard") {
    return {
      title: "Suas células estão estáveis agora.",
      subtitle: "Continue perto dos líderes e das células, sem transformar acompanhamento em cobrança.",
      tone: "ok",
    };
  }

  if (scope === "leaderDashboard") {
    return {
      title: "Sua célula está tranquila agora.",
      subtitle: "A visão mostra primeiro quem pede cuidado. A lista completa fica em Membros.",
      tone: "ok",
    };
  }

  return {
    title: "A célula está sem sinais abertos neste momento.",
    subtitle: "Continue acompanhando o ritmo de presença e cuidado.",
    tone: "ok",
  };
}

function groupPresenceMessage(role: UserRole, counts: Required<Pick<PastoralPulseCounts, "hasPendingEvent" | "hasRecentPresence" | "presenceRate">>): PastoralPulseMessage | null {
  if (counts.hasPendingEvent) {
    return {
      title: role === UserRole.LEADER
        ? "Há um encontro aguardando presença."
        : "Há presença aguardando registro nesta célula.",
      subtitle: role === UserRole.LEADER
        ? "Registre quando puder para manter a leitura pastoral em dia."
        : "Quando a liderança registrar, a leitura da célula fica mais clara.",
      tone: "calm",
    };
  }

  if (!counts.hasRecentPresence) {
    return {
      title: "Ainda sem presença recente registrada.",
      subtitle: role === UserRole.LEADER
        ? "Quando houver encontro, registre a presença para ajudar no cuidado da célula."
        : "Talvez a célula tenha se reunido, mas a presença ainda não foi marcada.",
      tone: "calm",
    };
  }

  if (counts.presenceRate < 70) {
    return {
      title: role === UserRole.LEADER
        ? "O ritmo de presença pede atenção."
        : "O ritmo de presença pede acompanhamento.",
      subtitle: isPastorRole(role)
        ? "Acompanhe o contexto da célula antes de orientar próximos passos."
        : role === UserRole.LEADER
          ? "Vale olhar quem faltou e se aproximar sem tom de cobrança."
          : "Veja se a liderança precisa de apoio para retomar vínculos.",
      tone: "attention",
    };
  }

  return null;
}

export function buildPastoralPulseMessage({
  viewerRole,
  scope,
  counts,
  subjects = {},
}: {
  viewerRole: UserRole;
  scope: PastoralPulseScope;
  counts: PastoralPulseCounts;
  subjects?: PastoralPulseSubjects;
}): PastoralPulseMessage {
  const normalizedCounts = {
    urgentOrPastoral: count(counts.urgentOrPastoral),
    support: scope === "pastorDashboard" ? 0 : count(counts.support),
    attention: scope === "pastorDashboard" ? 0 : count(counts.attention),
    inCare: count(counts.inCare),
  };
  const totalCare = totalCareCount(normalizedCounts);
  const activeCategories = activeCareCategories(normalizedCounts);

  if (totalCare > 1 && activeCategories > 1) {
    return mixedCareMessage(viewerRole, scope, normalizedCounts.urgentOrPastoral);
  }

  if (normalizedCounts.urgentOrPastoral > 0) {
    return urgentMessage(viewerRole, scope, normalizedCounts.urgentOrPastoral, subjects.urgentOrPastoral);
  }

  if (normalizedCounts.support > 0) {
    return supportMessage(viewerRole, scope, normalizedCounts.support, subjects.support);
  }

  if (normalizedCounts.attention > 0) {
    return attentionMessage(viewerRole, scope, normalizedCounts.attention, subjects.attention);
  }

  if (normalizedCounts.inCare > 0) {
    return inCareMessage(viewerRole, scope, normalizedCounts.inCare, subjects.inCare);
  }

  if (scope === "groupDetail") {
    const presenceMessage = groupPresenceMessage(viewerRole, {
      hasPendingEvent: Boolean(counts.hasPendingEvent),
      hasRecentPresence: Boolean(counts.hasRecentPresence),
      presenceRate: count(counts.presenceRate),
    });

    if (presenceMessage) return presenceMessage;
  }

  return stableMessage(scope);
}
