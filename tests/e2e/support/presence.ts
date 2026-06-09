import { AttendanceStatus } from "../../../src/generated/prisma/client";

export function formatPresenceRate(attendances: Array<{ status: AttendanceStatus }>) {
  const accountable = attendances.filter((attendance) => attendance.status !== AttendanceStatus.VISITOR);
  const present = accountable.filter((attendance) => attendance.status === AttendanceStatus.PRESENT);

  if (accountable.length === 0) return "0%";
  return `${Math.round((present.length / accountable.length) * 100)}%`;
}
