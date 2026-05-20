export type MemberAttendanceStatus = "PRESENT" | "ABSENT" | "JUSTIFIED";
export type AttendanceStatus = MemberAttendanceStatus | "VISITOR";
export type AttendanceSelection = MemberAttendanceStatus | null;
export type CheckInMode = "register" | "adjust";

export type CheckInItem = {
  personId: string;
  fullName: string;
  status: AttendanceSelection;
};

export type CheckInSummary = {
  totalMembers: number;
  present: number;
  justified: number;
  absent: number;
  pending: number;
  visitorTotal: number;
  presenceRate: number;
  hasPresenceData: boolean;
};

export const ATTENDANCE = {
  PRESENT: "PRESENT",
  ABSENT: "ABSENT",
  JUSTIFIED: "JUSTIFIED",
  VISITOR: "VISITOR",
} as const satisfies Record<AttendanceStatus, AttendanceStatus>;

export const MEMBER_ATTENDANCE_OPTIONS = [ATTENDANCE.PRESENT, ATTENDANCE.ABSENT, ATTENDANCE.JUSTIFIED] as const;

export const ATTENDANCE_LABELS: Record<MemberAttendanceStatus, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  JUSTIFIED: "Justificou",
};

export function getInitialMemberStatus(status?: AttendanceStatus | null): AttendanceSelection {
  if (!status || status === ATTENDANCE.VISITOR) return null;
  return status;
}

export function summarizeCheckInItems(items: CheckInItem[], visitorTotal: number): CheckInSummary {
  const counts = items.reduce(
    (acc, item) => {
      if (item.status === ATTENDANCE.PRESENT) acc.present += 1;
      else if (item.status === ATTENDANCE.JUSTIFIED) acc.justified += 1;
      else if (item.status === ATTENDANCE.ABSENT) acc.absent += 1;
      else acc.pending += 1;

      return acc;
    },
    {
      totalMembers: items.length,
      present: 0,
      justified: 0,
      absent: 0,
      pending: 0,
    },
  );

  const hasPresenceData = counts.totalMembers > 0 && counts.pending === 0;
  const presenceRate = hasPresenceData ? Math.round((counts.present / counts.totalMembers) * 100) : 0;

  return {
    ...counts,
    visitorTotal,
    presenceRate,
    hasPresenceData,
  };
}

export function markedMembersCount(summary: CheckInSummary) {
  return Math.max(0, summary.totalMembers - summary.pending);
}

export function checkInMarkedLabel(summary: CheckInSummary) {
  if (summary.totalMembers === 0) return "Nenhum membro";

  return `${markedMembersCount(summary)} de ${summary.totalMembers} marcados`;
}

export function checkInPendingLabel(summary: CheckInSummary) {
  if (summary.totalMembers === 0) return "Sem membros";
  if (summary.pending === 0) return "Todos marcados";
  if (summary.pending === 1) return "Falta 1 marcação";

  return `Faltam ${summary.pending} marcações`;
}

export function checkInHelperText(mode: CheckInMode) {
  return mode === "adjust"
    ? "Corrija apenas o que mudou neste encontro."
    : "Marque quem veio. Só isso já ajuda a lembrar quem pode precisar de cuidado.";
}

export function checkInMemberStatusHint(status: AttendanceSelection) {
  if (status === ATTENDANCE.PRESENT) return "Presença confirmada neste encontro.";
  if (status === ATTENDANCE.ABSENT) return "Ausência entra no radar para acompanhamento.";
  if (status === ATTENDANCE.JUSTIFIED) return "Justificou; mantenha o contexto sem tratar como falta seca.";
  return "Ainda falta registrar esta pessoa.";
}

export function checkInStatusOptionDescription(status: MemberAttendanceStatus) {
  if (status === ATTENDANCE.PRESENT) return "Veio ao encontro.";
  if (status === ATTENDANCE.ABSENT) return "Não veio e não houve justificativa.";
  return "Avisou ou explicou a ausência.";
}

export function checkInPastoralSignalMessage(summary: CheckInSummary) {
  if (summary.pending > 0) return null;
  if (summary.absent > 0 && summary.justified > 0) {
    return "Depois de salvar, ausências e justificativas ajudam o radar a apontar quem merece um olhar próximo.";
  }
  if (summary.absent > 0) {
    return "Depois de salvar, as ausências ajudam o radar a apontar quem talvez precise de cuidado.";
  }
  if (summary.justified > 0) {
    return "Depois de salvar, as justificativas ficam como contexto pastoral deste encontro.";
  }
  return null;
}

export function checkInConfirmationParam(mode: CheckInMode) {
  return mode === "adjust" ? "atualizada" : "registrada";
}
