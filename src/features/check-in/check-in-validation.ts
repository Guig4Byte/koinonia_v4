import { AttendanceStatus } from "../../generated/prisma/client";

export type MemberCheckInAttendance = {
  personId: string;
  status: AttendanceStatus | null | undefined;
};

export type CheckInValidationResult =
  | { ok: true }
  | { ok: false; error: string };

const memberAttendanceStatuses = new Set<AttendanceStatus>([
  AttendanceStatus.PRESENT,
  AttendanceStatus.ABSENT,
  AttendanceStatus.JUSTIFIED,
]);

export function validateMemberCheckInPayload(activeMemberIds: string[], attendances: MemberCheckInAttendance[]): CheckInValidationResult {
  const allowedPersonIds = new Set(activeMemberIds);
  const submittedPersonIds = attendances.map((attendance) => attendance.personId);
  const uniqueSubmittedPersonIds = new Set(submittedPersonIds);

  if (uniqueSubmittedPersonIds.size !== submittedPersonIds.length) {
    return { ok: false, error: "A presença contém pessoa duplicada" };
  }

  const hasInvalidStatus = attendances.some((attendance) => !attendance.status || !memberAttendanceStatuses.has(attendance.status));

  if (hasInvalidStatus) {
    return { ok: false, error: "Marque cada membro como presente, ausente ou justificou" };
  }

  const hasInvalidPerson = submittedPersonIds.some((personId) => !allowedPersonIds.has(personId));

  if (hasInvalidPerson) {
    return { ok: false, error: "A presença contém pessoa fora desta célula" };
  }

  const hasMissingPerson = activeMemberIds.some((personId) => !uniqueSubmittedPersonIds.has(personId));

  if (hasMissingPerson) {
    return { ok: false, error: "Marque todos os membros ativos da célula antes de finalizar" };
  }

  return { ok: true };
}
