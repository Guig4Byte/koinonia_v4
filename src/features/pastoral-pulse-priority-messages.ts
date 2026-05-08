import { UserRole } from "@/generated/prisma/client";
import type { PastoralPulseMessage, PastoralPulseScope, PastoralPulseSubject } from "./pastoral-pulse";
import { groupPrefix, isPastorRole } from "./pastoral-pulse-message-utils";

export function mixedCareMessage(role: UserRole, scope: PastoralPulseScope, urgentOrPastoral: number): PastoralPulseMessage {
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
      subtitle: "Os sinais mais sensíveis aparecem primeiro; os demais seguem no radar com calma.",
      tone: "attention",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    return {
      title: "Há cuidados em momentos diferentes.",
      subtitle: urgentOrPastoral > 0
        ? "Os sinais mais sensíveis ajudam a orientar o acompanhamento junto da liderança."
        : "Alguns pedem apoio da supervisão, outros seguem como atenção local.",
      tone: "attention",
    };
  }

  return {
    title: "Há cuidados com prioridades diferentes.",
    subtitle: urgentOrPastoral > 0
      ? "Os sinais mais sensíveis aparecem primeiro; os demais seguem no radar."
      : "Alguns pedem uma aproximação simples, outros seguem em cuidado.",
    tone: "attention",
  };
}

export function urgentMessage(
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
        subtitle: "Os sinais ajudam a perceber onde o cuidado pode pedir mais proximidade.",
        tone: "attention",
      };
    }

    return {
      title: urgentOrPastoral === 1
        ? "Há um cuidado sensível nesta célula."
        : "Há cuidados sensíveis nesta célula.",
      subtitle: isPastorRole(role)
        ? "Algumas pessoas podem precisar de um olhar pastoral mais próximo."
        : "A liderança segue perto; o cuidado pode pedir apoio em alguns pontos.",
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
    subtitle: "Há sinais sensíveis aqui. Cada pessoa pode ser acolhida com calma e proximidade.",
    tone: "attention",
  };
}

export function supportMessage(
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
        title: `${subject.personName} tem um pedido de apoio da supervisão.`,
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

export function attentionMessage(
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
      subtitle: "Acompanhe com calma e perceba onde a liderança pode pedir apoio.",
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
