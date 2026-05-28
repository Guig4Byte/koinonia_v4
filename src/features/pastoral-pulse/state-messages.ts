import { UserRole } from "@/generated/prisma/client";
import { DEFAULT_PRESENCE_TONE_THRESHOLDS } from "@/features/events/presence-display";
import type { PastoralPulseCounts, PastoralPulseMessage, PastoralPulseScope, PastoralPulseSubject } from ".";
import { isPastoralRole } from "@/features/permissions/permissions";

export function inCareMessage(
  role: UserRole,
  scope: PastoralPulseScope,
  inCare: number,
  subject?: PastoralPulseSubject | null,
): PastoralPulseMessage {
  if (scope === "groupDetail") {
    return {
      title: inCare === 1
        ? "Um irmão segue em cuidado nesta célula."
        : "Há irmãos em cuidado nesta célula.",
      subtitle: role === UserRole.LEADER
        ? "O acompanhamento pode seguir com leveza, sem transformar cuidado em cobrança."
        : "Eles já receberam cuidado e seguem no radar com leveza.",
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
      subtitle: "O irmão já recebeu cuidado e continua no radar.",
      tone: "ok",
    };
  }

  return {
    title: `${inCare} irmãos seguem em cuidado.`,
    subtitle: "Eles já receberam cuidado e continuam no radar com leveza.",
    tone: "ok",
  };
}

export function stableMessage(scope: PastoralPulseScope): PastoralPulseMessage {
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
      subtitle: "A proximidade com líderes e células pode seguir sem transformar acompanhamento em cobrança.",
      tone: "ok",
    };
  }

  if (scope === "leaderDashboard") {
    return {
      title: "Sua célula está tranquila agora.",
      subtitle: "A visão mostra primeiro quem pede cuidado. A lista completa fica em Célula.",
      tone: "ok",
    };
  }

  return {
    title: "A célula está sem sinais abertos neste momento.",
    subtitle: "O ritmo de presença e cuidado continua como referência.",
    tone: "ok",
  };
}

export function groupPresenceMessage(role: UserRole, counts: Required<Pick<PastoralPulseCounts, "hasPendingEvent" | "hasRecentPresence" | "presenceRate">>): PastoralPulseMessage | null {
  if (counts.hasPendingEvent) {
    return {
      title: role === UserRole.LEADER
        ? "Há um encontro aguardando presença."
        : "Há presença aguardando registro nesta célula.",
      subtitle: role === UserRole.LEADER
        ? "Quando a presença for registrada, a leitura pastoral fica mais clara."
        : "Quando a liderança registrar, a leitura da célula fica mais clara.",
      tone: "calm",
    };
  }

  if (!counts.hasRecentPresence) {
    return {
      title: "Ainda sem presença recente registrada.",
      subtitle: role === UserRole.LEADER
        ? "Quando a presença for registrada, o cuidado da célula fica mais claro."
        : "Talvez a célula tenha se reunido, mas a presença ainda não foi marcada.",
      tone: "calm",
    };
  }

  if (counts.presenceRate < DEFAULT_PRESENCE_TONE_THRESHOLDS.warn) {
    return {
      title: role === UserRole.LEADER
        ? "O ritmo de presença pede atenção."
        : "O ritmo de presença pede acompanhamento.",
      subtitle: isPastoralRole(role)
        ? "O contexto da célula ajuda antes de orientar próximos passos."
        : role === UserRole.LEADER
          ? "Vale olhar quem faltou e se aproximar sem tom de cobrança."
          : "Pode ser um sinal para perceber se a liderança quer apoio para retomar vínculos.",
      tone: "attention",
    };
  }

  return null;
}
