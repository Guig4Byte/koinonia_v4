import { AttendanceStatus } from "@/generated/prisma/client";
import { closedWithoutPresenceLabel, isClosedWithoutPresenceStatus } from "@/features/events/event-display";
import { countLabel } from "@/lib/format";
import { compareByFullName } from "@/lib/text";

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
  description?: string;
  members: EventReadOnlyMember[];
};

export type EventPastoralCue = {
  title: string;
  description: string;
  tone: EventDetailBadgeTone;
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
  return [...people].sort(compareByFullName);
}


export function justifiedCountLabel(count: number) {
  return count === 1 ? "1 justificou" : `${count} justificaram`;
}

function joinAttentionParts(parts: string[]) {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

export function buildEventPastoralCue({
  absent,
  justified,
  pending,
}: {
  absent: number;
  justified: number;
  pending: number;
}): EventPastoralCue {
  if (pending > 0) {
    return {
      title: "Presença ainda incompleta",
      description: `${countLabel(pending, "irmão sem marcação", "irmãos sem marcação")} ainda sem marcação. O registro completo deixa a leitura do encontro mais fiel.`,
      tone: "warn",
    };
  }

  const attentionParts = [
    absent > 0 ? countLabel(absent, "ausente") : null,
    justified > 0 ? justifiedCountLabel(justified) : null,
  ].filter((part): part is string => Boolean(part));

  if (attentionParts.length > 0) {
    return {
      title: "Olhar com calma",
      description: `${joinAttentionParts(attentionParts)}. Ausência ou justificativa isolada nem sempre indica problema; vale observar o contexto antes de decidir qualquer cuidado.`,
      tone: absent > 0 ? "risk" : "warn",
    };
  }

  return {
    title: "Encontro sem sinais imediatos",
    description: "Todos os membros marcados estiveram presentes. Nenhuma ausência ou justificativa pede atenção agora.",
    tone: "ok",
  };
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

  const memberTotalLabel = countLabel(members.length, "membro");
  const memberBreakdownLabel = [
    countLabel(presentMembers.length, "presente"),
    countLabel(absentMembers.length, "ausente"),
    justifiedMembers.length > 0 ? justifiedCountLabel(justifiedMembers.length) : null,
    pendingMembers.length > 0 ? countLabel(pendingMembers.length, "sem marcação", "sem marcação") : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const memberSummary = [memberTotalLabel, memberBreakdownLabel].filter(Boolean).join(" · ");

  return {
    memberTotalLabel,
    memberBreakdownLabel,
    memberSummary,
    pastoralCue: buildEventPastoralCue({
      absent: absentMembers.length,
      justified: justifiedMembers.length,
      pending: pendingMembers.length,
    }),
    presentMembers,
    visitorsTitle: "Visitantes",
    hasPriorityAttention: absentMembers.length > 0 || justifiedMembers.length > 0 || pendingMembers.length > 0,
    groups: [
      {
        title: `Ausentes (${absentMembers.length})`,
        members: absentMembers,
      },
      {
        title: `Justificaram (${justifiedMembers.length})`,
        members: justifiedMembers,
      },
      {
        title: `Sem marcação (${pendingMembers.length})`,
        description: "Ainda sem marcação explícita; complete o registro para ter uma leitura fiel.",
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
      ? "Este encontro foi cancelado. Ele não aparece como presença aguardando registro."
      : "Este encontro foi marcado como não realizado. Ele não fica como presença aguardando registro.";
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
        : "Detalhes da presença";

  const eventStatusLabel = isCancelledEvent
    ? closedWithoutPresenceLabel(status)
    : completed
      ? "Presença registrada"
      : isFutureEvent
        ? "Agendado"
        : canEditCheckIn
          ? "Aguardando presença"
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
