import { describe, expect, it } from "vitest";
import {
  ATTENDANCE,
  checkInConfirmationParam,
  checkInHelperText,
  checkInMarkedLabel,
  checkInPendingLabel,
  getInitialMemberStatus,
  markedMembersCount,
  summarizeCheckInItems,
} from "./check-in-view";

describe("check-in view helpers", () => {
  it("keeps visitor attendance out of member initial status", () => {
    expect(getInitialMemberStatus(ATTENDANCE.VISITOR)).toBeNull();
    expect(getInitialMemberStatus(null)).toBeNull();
    expect(getInitialMemberStatus(ATTENDANCE.PRESENT)).toBe(ATTENDANCE.PRESENT);
  });

  it("summarizes marked members and visitors", () => {
    expect(summarizeCheckInItems([
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: ATTENDANCE.JUSTIFIED },
      { personId: "3", fullName: "Caio", status: ATTENDANCE.ABSENT },
      { personId: "4", fullName: "Davi", status: null },
    ], 2)).toEqual({
      totalMembers: 4,
      present: 1,
      justified: 1,
      absent: 1,
      pending: 1,
      visitorTotal: 2,
      presenceRate: 0,
      hasPresenceData: false,
    });
  });

  it("calculates presence rate only when every member is marked", () => {
    expect(summarizeCheckInItems([
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: ATTENDANCE.ABSENT },
    ], 0)).toMatchObject({
      presenceRate: 50,
      hasPresenceData: true,
    });
  });

  it("formats check-in progress labels", () => {
    const summary = summarizeCheckInItems([
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: null },
      { personId: "3", fullName: "Caio", status: null },
    ], 1);

    expect(markedMembersCount(summary)).toBe(1);
    expect(checkInMarkedLabel(summary)).toBe("1 de 3 marcados");
    expect(checkInPendingLabel(summary)).toBe("Faltam 2 marcações");
  });

  it("formats completed check-in progress labels", () => {
    const summary = summarizeCheckInItems([
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: ATTENDANCE.JUSTIFIED },
    ], 0);

    expect(checkInMarkedLabel(summary)).toBe("2 de 2 marcados");
    expect(checkInPendingLabel(summary)).toBe("Todos marcados");
  });

  it("keeps mode-specific copy in one place", () => {
    expect(checkInHelperText("register")).toContain("Marque quem veio");
    expect(checkInHelperText("adjust")).toContain("Corrija");
    expect(checkInConfirmationParam("register")).toBe("registrada");
    expect(checkInConfirmationParam("adjust")).toBe("atualizada");
  });
});
