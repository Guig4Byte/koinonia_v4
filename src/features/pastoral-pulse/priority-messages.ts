import { UserRole } from "@/generated/prisma/client";
import type { PastoralPulseMessage, PastoralPulseScope, PastoralPulseSubject } from ".";
import { isPastoralRole } from "@/features/permissions/permissions";
import { groupPrefix } from "@/features/pastoral-pulse/message-utils";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";

export function mixedCareMessage(role: UserRole, scope: PastoralPulseScope, urgentOrPastoral: number): PastoralPulseMessage {
  if (scope === "pastorDashboard") {
    return {
      title: "Há cuidados com prioridades diferentes.",
      subtitle: "Os casos sensíveis aparecem primeiro; os demais seguem com líderes e supervisores.",
      tone: "attention",
    };
  }

  if (scope === "groupDetail") {
    if (isPastoralRole(role)) {
      return {
        title: "Prioridade de cuidados nesta célula.",
        subtitle: "Os sinais mais sensíveis aparecem primeiro; os demais seguem com líderes e supervisores.",
        tone: "attention",
      };
    }

    if (role === UserRole.SUPERVISOR) {
      return {
        title: "Há cuidados em momentos diferentes nesta célula.",
        subtitle: "Os sinais podem ser lidos com calma, caminhando junto com a liderança.",
        tone: "attention",
      };
    }

    return {
      title: "Prioridade de cuidados nesta célula.",
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
        subtitle: "O contexto ajuda antes de orientar a equipe.",
        tone: "attention",
      };
    }

    return {
      title: `${urgentOrPastoral} irmãos pedem um olhar pastoral mais próximo.`,
      subtitle: "Há sinais sensíveis aqui. O contexto ajuda antes de orientar a equipe.",
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
      subtitle: isPastoralRole(role)
        ? "Alguns irmãos podem precisar de um olhar pastoral mais próximo."
        : "A liderança segue perto; o cuidado pode pedir apoio em alguns pontos.",
      tone: "attention",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    if (urgentOrPastoral === 1 && subject?.personName) {
      return {
        title: `${subject.personName} pede cuidado mais próximo.`,
        subtitle: `${groupPrefix(subject)}o cuidado pode seguir junto da liderança, sem assumir a operação da célula.`,
        tone: "attention",
      };
    }

    return {
      title: `${urgentOrPastoral} irmãos pedem cuidado mais próximo.`,
      subtitle: "Há sinais sensíveis aqui. Os casos podem ser lidos com calma, junto da liderança.",
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
    subtitle: "Há sinais sensíveis aqui. Cada irmão pode ser acolhido com calma e proximidade.",
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
        title: support === 1 ? SIGNAL_COPY.support.pulse.leaderSingleTitle : SIGNAL_COPY.support.pulse.leaderPluralTitle,
        subtitle: SIGNAL_COPY.support.pulse.leaderGroupSubtitle,
        tone: "attention",
      };
    }

    if (role === UserRole.SUPERVISOR) {
      return {
        title: support === 1
          ? SIGNAL_COPY.support.pulse.supervisorGroupSingleTitle
          : SIGNAL_COPY.support.pulse.supervisorGroupPluralTitle,
        subtitle: SIGNAL_COPY.support.pulse.supervisorGroupSubtitle,
        tone: "attention",
      };
    }

    return {
      title: SIGNAL_COPY.support.pulse.inProgressGroupTitle,
      subtitle: SIGNAL_COPY.support.pulse.inProgressGroupSubtitle,
      tone: "calm",
    };
  }

  if (role === UserRole.SUPERVISOR) {
    if (support === 1 && subject?.personName) {
      return {
        title: SIGNAL_COPY.support.pulse.supervisorPersonTitle(subject.personName),
        subtitle: SIGNAL_COPY.support.pulse.supervisorPersonSubtitle(groupPrefix(subject)),
        tone: "attention",
      };
    }

    return {
      title: SIGNAL_COPY.support.pulse.supervisorDashboardTitle(support),
      subtitle: SIGNAL_COPY.support.pulse.supervisorDashboardSubtitle,
      tone: "attention",
    };
  }

  if (role === UserRole.LEADER) {
    return {
      title: support === 1 ? SIGNAL_COPY.support.pulse.leaderSingleTitle : SIGNAL_COPY.support.pulse.leaderPluralTitle,
      subtitle: SIGNAL_COPY.support.pulse.leaderDashboardSubtitle,
      tone: "attention",
    };
  }

  return {
    title: SIGNAL_COPY.support.pulse.inProgressDashboardTitle,
    subtitle: SIGNAL_COPY.support.pulse.inProgressGroupSubtitle,
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
    if (isPastoralRole(role)) {
      return {
        title: "Há atenção local nesta célula.",
        subtitle: "Esse cuidado segue com líderes e supervisores.",
        tone: "calm",
      };
    }

    if (attention === 1) {
      return {
        title: "Um irmão pede acompanhamento mais próximo.",
        subtitle: role === UserRole.LEADER
          ? "Vale uma aproximação simples, sem tom de cobrança."
          : "A liderança segue cuidando, mas vale manter esta célula no radar.",
        tone: "attention",
      };
    }

    return {
      title: "Há irmãos para acompanhar de perto.",
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
      subtitle: "Uma leitura calma ajuda a perceber onde a liderança pode pedir apoio.",
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
