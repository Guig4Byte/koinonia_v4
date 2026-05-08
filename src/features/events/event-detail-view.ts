import { AttendanceStatus } from "@/generated/prisma/client";
import { closedWithoutPresenceLabel, isClosedWithoutPresenceStatus } from "@/features/events/event-display";

export type EventDetailBadgeTone = "neutral" | "ok" | "warn" | "risk" | "info";

export type EventReadOnlyMember = {
  personId: string;
  fullName: string;
  currentStatus?: AttendanceStatus | null;
};

export type EventReadOnlyVisitor = {
  id: string;
  personId: string;
  fullName: string;
};

export type EventAttendanceGroup = {
  title: string;
  description: string;
  members: EventReadOnlyMember[];
};

export const eventAttendanceLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
  VISITOR: "Visitante",
};

export function eventAttendanceStatusTone(status?: AttendanceStatus | null): EventDetailBadgeTone {
  if (status === AttendanceStatus.PRESENT) return "ok";
  if (status === AttendanceStatus.JUSTIFIED) return "warn";
  if (status === AttendanceStatus.ABSENT) return "risk";
  return "info";
}

export function sortPeopleByName<T extends { fullName: string }>(people: T[]) {
  return [...people].sort((left, right) => left.fullName.localeCompare(right.fullName, "pt-BR"));
}

export function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function justifiedCountLabel(count: number) {
  return count === 1 ? "1 justificou" : `${count} justificaram`;
}

export function savedPresenceMessage(value?: string | null) {
  if (value === "atualizada") return "Presença atualizada. O resumo do encontro já reflete os ajustes feitos.";
  if (value === "registrada") return "Presença registrada. O resumo do encontro já está disponível.";
  return null;
}

export function buildEventReadOnlyAttendanceView(members: EventReadOnlyMember[]) {
  const absentMembers = sortPeopleByName(members.filter((member) => member.currentStatus === AttendanceStatus.ABSENT));
  const justifiedMembers = sortPeopleByName(members.filter((member) => member.currentStatus === AttendanceStatus.JUSTIFIED));
  const pendingMembers = sortPeopleByName(members.filter((member) => !member.currentStatus));
  const presentMembers = sortPeopleByName(members.filter((member) => member.currentStatus === AttendanceStatus.PRESENT));

  const memberSummary = [
    countLabel(members.length, "membro"),
    countLabel(presentMembers.length, "presente"),
    countLabel(absentMembers.length, "ausente"),
    justifiedMembers.length > 0 ? justifiedCountLabel(justifiedMembers.length) : null,
    pendingMembers.length > 0 ? countLabel(pendingMembers.length, "pendente") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    memberSummary,
    presentMembers,
    visitorsTitle: "Visitantes",
    hasPriorityAttention: absentMembers.length > 0 || justifiedMembers.length > 0 || pendingMembers.length > 0,
    groups: [
      {
        title: `Ausentes (${absentMembers.length})`,
        description: "Quem faltou neste encontro.",
        members: absentMembers,
      },
      {
        title: `Justificaram (${justifiedMembers.length})`,
        description: "Quem avisou e justificou a ausência.",
        members: justifiedMembers,
      },
      {
        title: `Pendentes (${pendingMembers.length})`,
        description: "Membros ainda sem marcação explícita.",
        members: pendingMembers,
      },
    ] satisfies EventAttendanceGroup[],
  };
}

export function eventReadOnlyEmptyMessage({
  completed,
  isFutureEvent,
  isCancelled,
  closedLabel,
}: {
  completed: boolean;
  isFutureEvent: boolean;
  isCancelled: boolean;
  closedLabel: string;
}) {
  if (isCancelled) {
    return closedLabel === "Cancelado"
      ? "Este encontro foi cancelado. Ele não aparece como presença pendente."
      : "Este encontro foi marcado como não realizado. Ele não entra como presença atrasada.";
  }

  if (!completed) {
    return isFutureEvent
      ? "Este encontro ainda não começou. A presença poderá ser registrada depois que começar."
      : "A presença ainda não foi registrada. O líder da célula registra o encontro; pastor e supervisor acompanham o resumo quando ele estiver pronto.";
  }

  return null;
}

export function buildEventDetailState({
  status,
  completed,
  isFutureEvent,
  canEditCheckIn,
  showCheckInForm,
}: {
  status: string;
  completed: boolean;
  isFutureEvent: boolean;
  canEditCheckIn: boolean;
  showCheckInForm: boolean;
}) {
  const isCancelledEvent = isClosedWithoutPresenceStatus(status);

  const checkInLabel = showCheckInForm
    ? completed
      ? "Ajuste de presença"
      : "Registrar presença"
    : isCancelledEvent
      ? closedWithoutPresenceLabel(status)
      : isFutureEvent
        ? "Encontro agendado"
        : "Resumo de presença";

  const checkInSectionTitle = showCheckInForm
    ? completed
      ? "Ajustar presença"
      : "Registrar presença"
    : isCancelledEvent
      ? "Sobre o encontro"
      : isFutureEvent
        ? "Sobre o encontro"
        : "Resumo da presença";

  const eventStatusLabel = isCancelledEvent
    ? closedWithoutPresenceLabel(status)
    : completed
      ? "Presença registrada"
      : isFutureEvent
        ? "Agendado"
        : canEditCheckIn
          ? "Presença pendente"
          : "Aguardando registro";

  const eventStatusTone: EventDetailBadgeTone = isCancelledEvent ? "neutral" : completed ? "ok" : isFutureEvent ? "info" : "warn";

  return {
    checkInLabel,
    checkInSectionTitle,
    checkInSubmitLabel: completed ? "Salvar ajuste" : "Salvar presença",
    eventStatusLabel,
    eventStatusTone,
  };
}
