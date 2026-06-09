import { describe, expect, it } from "vitest";
import {
  ATTENDANCE,
  attendanceLabel,
  attendanceStatusDescription,
  attendanceTone,
  attendanceVisualTone,
  isMemberAttendanceStatus,
  memberAttendanceLabel,
} from "@/features/events/attendance-display";

describe("attendance-display", () => {
  it("keeps attendance labels centralized and pastoral", () => {
    expect(attendanceLabel(ATTENDANCE.PRESENT)).toBe("Presente");
    expect(attendanceLabel(ATTENDANCE.ABSENT)).toBe("Ausente");
    expect(attendanceLabel(ATTENDANCE.JUSTIFIED)).toBe("Justificou");
    expect(attendanceLabel(ATTENDANCE.VISITOR)).toBe("Visitante");
    expect(memberAttendanceLabel(ATTENDANCE.PRESENT)).toBe("Presente");
  });

  it("classifies member attendance statuses without including visitors", () => {
    expect(isMemberAttendanceStatus(ATTENDANCE.PRESENT)).toBe(true);
    expect(isMemberAttendanceStatus(ATTENDANCE.ABSENT)).toBe(true);
    expect(isMemberAttendanceStatus(ATTENDANCE.JUSTIFIED)).toBe(true);
    expect(isMemberAttendanceStatus(ATTENDANCE.VISITOR)).toBe(false);
    expect(isMemberAttendanceStatus(null)).toBe(false);
  });

  it("maps attendance statuses to shared semantic tones", () => {
    expect(attendanceTone(ATTENDANCE.PRESENT)).toBe("ok");
    expect(attendanceTone(ATTENDANCE.JUSTIFIED)).toBe("warn");
    expect(attendanceTone(ATTENDANCE.ABSENT)).toBe("risk");
    expect(attendanceTone(ATTENDANCE.VISITOR)).toBe("info");
    expect(attendanceTone(null)).toBe("info");
  });

  it("maps attendance statuses to row visual tones", () => {
    expect(attendanceVisualTone(ATTENDANCE.PRESENT)).toBe("present");
    expect(attendanceVisualTone(ATTENDANCE.ABSENT)).toBe("absent");
    expect(attendanceVisualTone(ATTENDANCE.JUSTIFIED)).toBe("justified");
    expect(attendanceVisualTone(ATTENDANCE.VISITOR)).toBe("visitor");
    expect(attendanceVisualTone(null)).toBe("pending");
  });

  it("keeps check-in descriptions in the same source as the labels", () => {
    expect(attendanceStatusDescription(ATTENDANCE.PRESENT)).toBe("Veio ao encontro.");
    expect(attendanceStatusDescription(ATTENDANCE.ABSENT)).toContain("Não veio");
    expect(attendanceStatusDescription(ATTENDANCE.JUSTIFIED)).toContain("Avisou");
  });
});
