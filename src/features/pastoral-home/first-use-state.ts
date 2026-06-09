import { UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

export type FirstUseState = {
  title: string;
  detail: string;
  href: string;
  label: string;
};

export function buildPastorFirstUseState({
  groupsCount,
  hasRecordedMeetings,
  hasPastoralAttention,
}: {
  groupsCount: number;
  hasRecordedMeetings: boolean;
  hasPastoralAttention: boolean;
}): FirstUseState | null {
  if (groupsCount === 0 || hasRecordedMeetings || hasPastoralAttention) return null;

  return {
    title: "Ainda não há encontros registrados.",
    detail: "Quando os líderes fizerem o primeiro check-in, os sinais pastorais aparecerão aqui.",
    href: ROUTES.team,
    label: "Ver equipe",
  };
}

export function buildSupervisorFirstUseState({
  groups,
  hasRecordedMeetings,
  hasPastoralAttention,
}: {
  groups: { id: string; name: string }[];
  hasRecordedMeetings: boolean;
  hasPastoralAttention: boolean;
}): FirstUseState | null {
  if (groups.length === 0 || hasRecordedMeetings || hasPastoralAttention) return null;

  const singleGroup = groups.length === 1 ? groups[0] : null;

  return {
    title: singleGroup
      ? `A ${singleGroup.name} ainda não tem histórico de encontros.`
      : "As células supervisionadas ainda não têm histórico de encontros.",
    detail: "Após os primeiros registros, você verá estabilidade, presença e pedidos de apoio.",
    href: singleGroup ? ROUTES.group(singleGroup.id) : ROUTES.cells,
    label: singleGroup ? `Ver ${singleGroup.name}` : "Ver células",
  };
}

export function buildLeaderFirstUseState({
  primaryGroupId,
  currentEventId,
  hasRecordedMeetings,
  hasPeopleInRadar,
}: {
  primaryGroupId: string | null;
  currentEventId?: string | null;
  hasRecordedMeetings: boolean;
  hasPeopleInRadar: boolean;
}): FirstUseState | null {
  if (!primaryGroupId || hasRecordedMeetings || hasPeopleInRadar) return null;

  return {
    title: "Sua célula está pronta.",
    detail: "Registre o primeiro encontro para começar o acompanhamento.",
    href: currentEventId ? ROUTES.event(currentEventId) : ROUTES.group(primaryGroupId),
    label: currentEventId ? "Registrar presença" : "Abrir célula",
  };
}

export function firstUsePulseForRole(role: UserRole): { title: string; subtitle: string; tone: "calm" } {
  switch (role) {
    case UserRole.SUPERVISOR:
      return {
        title: "A supervisão está pronta para o primeiro registro.",
        subtitle: "Depois dos primeiros check-ins, estabilidade, presença e pedidos de apoio ganham contexto.",
        tone: "calm",
      };
    case UserRole.LEADER:
      return {
        title: "Sua célula está pronta para começar.",
        subtitle: "O primeiro check-in cria o histórico que alimenta a leitura pastoral.",
        tone: "calm",
      };
    default:
      return {
        title: "A estrutura está pronta para receber os primeiros registros.",
        subtitle: "Quando os líderes fizerem check-in, a visão pastoral começa a ganhar sinais e histórico.",
        tone: "calm",
      };
  }
}
