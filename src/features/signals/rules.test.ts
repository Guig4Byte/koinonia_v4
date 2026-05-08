import { describe, expect, it } from "vitest";
import { AttendanceStatus, SignalSeverity } from "../../generated/prisma/client";
import {
  countConsecutiveAbsences,
  describeAttendanceEvidence,
  describeAttendanceSignal,
  getConsecutiveAbsenceDatesNewestFirst,
  getRecordedStatusesNewestFirst,
  shouldKeepAttendanceSignalResolved,
} from "./rules-core";

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


  it("describes the dates behind attendance evidence", () => {
    const dates = [
      new Date("2026-04-30T23:00:00.000Z"),
      new Date("2026-04-23T23:00:00.000Z"),
      new Date("2026-04-16T23:00:00.000Z"),
    ];

    expect(describeAttendanceEvidence(dates)).toBe("Ausente nos últimos 3 encontros registrados: 16 abr, 23 abr e 30 abr.");
    expect(describeAttendanceEvidence(dates.slice(0, 2))).toBe("Ausente em: 23 abr e 30 abr.");
  });

  it("gets consecutive absence dates from recorded attendance events", () => {
    const dates = getConsecutiveAbsenceDatesNewestFirst(
      [
        { startsAt: new Date("2026-04-30T23:00:00.000Z"), attendances: [{ personId: "person-1", status: AttendanceStatus.ABSENT }] },
        { startsAt: new Date("2026-04-23T23:00:00.000Z"), attendances: [{ personId: "person-2", status: AttendanceStatus.PRESENT }] },
        { startsAt: new Date("2026-04-16T23:00:00.000Z"), attendances: [{ personId: "person-1", status: AttendanceStatus.ABSENT }] },
        { startsAt: new Date("2026-04-09T23:00:00.000Z"), attendances: [{ personId: "person-1", status: AttendanceStatus.PRESENT }] },
      ],
      "person-1",
    );

    expect(dates).toEqual([new Date("2026-04-30T23:00:00.000Z"), new Date("2026-04-16T23:00:00.000Z")]);
  });

  it("does not reopen the same attendance signal after care for the same evidence", () => {
    const signal = describeAttendanceSignal(3);

    expect(signal).not.toBeNull();
    expect(
      shouldKeepAttendanceSignalResolved(signal!, new Date("2026-04-20T20:00:00.000Z"), {
        reason: signal!.reason,
        evidence: signal!.evidence,
        resolvedAt: new Date("2026-04-21T10:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("keeps resolved attendance signals compatible with older wording", () => {
    const signal = describeAttendanceSignal(3);

    expect(signal).not.toBeNull();
    expect(
      shouldKeepAttendanceSignalResolved(signal!, new Date("2026-04-20T20:00:00.000Z"), {
        reason: "3 faltas seguidas. Pode estar se afastando.",
        evidence: "Presença recente indica afastamento.",
        resolvedAt: new Date("2026-04-21T10:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("allows reopening an attendance signal when the evidence is newer than the care", () => {
    const signal = describeAttendanceSignal(3);

    expect(signal).not.toBeNull();
    expect(
      shouldKeepAttendanceSignalResolved(signal!, new Date("2026-04-22T20:00:00.000Z"), {
        reason: signal!.reason,
        evidence: signal!.evidence,
        resolvedAt: new Date("2026-04-21T10:00:00.000Z"),
      }),
    ).toBe(false);
  });
});
