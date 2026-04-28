import { describe, expect, it } from "vitest";
import { AttendanceStatus, SignalSeverity } from "../../generated/prisma/client";
import { countConsecutiveAbsences, describeAttendanceSignal, getRecordedStatusesNewestFirst } from "./rules-core";

describe("attendance signal rules", () => {
  it("counts absences only until the first present/justified record", () => {
    expect(countConsecutiveAbsences([AttendanceStatus.ABSENT, AttendanceStatus.ABSENT, AttendanceStatus.PRESENT])).toBe(2);
    expect(countConsecutiveAbsences([AttendanceStatus.PRESENT, AttendanceStatus.ABSENT])).toBe(0);
    expect(countConsecutiveAbsences([AttendanceStatus.JUSTIFIED, AttendanceStatus.ABSENT])).toBe(0);
  });

  it("creates a gentle attention signal after two absences", () => {
    expect(describeAttendanceSignal(2)?.severity).toBe(SignalSeverity.ATTENTION);
  });

  it("creates an urgent signal after three absences", () => {
    expect(describeAttendanceSignal(3)?.severity).toBe(SignalSeverity.URGENT);
  });

  it("uses only attendance records that actually exist for the person", () => {
    const statuses = getRecordedStatusesNewestFirst(
      [
        { attendances: [] },
        { attendances: [{ personId: "person-1", status: AttendanceStatus.ABSENT }] },
        { attendances: [{ personId: "person-1", status: AttendanceStatus.ABSENT }] },
        { attendances: [{ personId: "person-2", status: AttendanceStatus.ABSENT }] },
      ],
      "person-1",
    );

    expect(statuses).toEqual([AttendanceStatus.ABSENT, AttendanceStatus.ABSENT]);
    expect(countConsecutiveAbsences(statuses)).toBe(2);
  });
});
