import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "../../generated/prisma/client";
import { validateMemberCheckInPayload } from "./check-in-validation";

const activeMembers = ["person-1", "person-2"];

describe("check-in validation", () => {
  it("accepts one explicit member status for each active member", () => {
    expect(validateMemberCheckInPayload(activeMembers, [
      { personId: "person-1", status: AttendanceStatus.PRESENT },
      { personId: "person-2", status: AttendanceStatus.JUSTIFIED },
    ])).toEqual({ ok: true });
  });

  it("rejects duplicated members", () => {
    expect(validateMemberCheckInPayload(activeMembers, [
      { personId: "person-1", status: AttendanceStatus.PRESENT },
      { personId: "person-1", status: AttendanceStatus.ABSENT },
    ])).toEqual({ ok: false, error: "A presença contém pessoa duplicada" });
  });

  it("rejects visitor status as member attendance", () => {
    expect(validateMemberCheckInPayload(activeMembers, [
      { personId: "person-1", status: AttendanceStatus.PRESENT },
      { personId: "person-2", status: AttendanceStatus.VISITOR },
    ])).toEqual({ ok: false, error: "Marque cada membro como presente, ausente ou justificou" });
  });

  it("rejects people outside the event group", () => {
    expect(validateMemberCheckInPayload(activeMembers, [
      { personId: "person-1", status: AttendanceStatus.PRESENT },
      { personId: "person-3", status: AttendanceStatus.ABSENT },
    ])).toEqual({ ok: false, error: "A presença contém pessoa fora desta célula" });
  });

  it("rejects missing active members", () => {
    expect(validateMemberCheckInPayload(activeMembers, [
      { personId: "person-1", status: AttendanceStatus.PRESENT },
    ])).toEqual({ ok: false, error: "Marque todos os membros ativos da célula antes de finalizar" });
  });
});
