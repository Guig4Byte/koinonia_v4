import { describe, expect, it } from "vitest";
import {
  ATTENDANCE,
  CHECK_IN_MEMBER_FILTERS,
  checkInConfirmationParam,
  checkInFilterCount,
  checkInFilterLabel,
  checkInFilteredEmptyMessage,
  checkInMarkedLabel,
  filterCheckInItems,
  getInitialMemberStatus,
  markedMembersCount,
  sortCheckInItemsForDisplay,
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
  });

  it("formats completed check-in progress labels", () => {
    const summary = summarizeCheckInItems([
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: ATTENDANCE.JUSTIFIED },
    ], 0);

    expect(checkInMarkedLabel(summary)).toBe("2 de 2 marcados");
  });

  it("sorts pending members first without mutating the original list", () => {
    const items = [
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: null },
      { personId: "3", fullName: "Caio", status: ATTENDANCE.ABSENT },
      { personId: "4", fullName: "Davi", status: null },
    ];

    expect(sortCheckInItemsForDisplay(items).map((item) => item.fullName)).toEqual(["Bia", "Davi", "Ana", "Caio"]);
    expect(items.map((item) => item.fullName)).toEqual(["Ana", "Bia", "Caio", "Davi"]);
  });

  it("filters members by check-in status", () => {
    const items = [
      { personId: "1", fullName: "Ana", status: ATTENDANCE.PRESENT },
      { personId: "2", fullName: "Bia", status: ATTENDANCE.JUSTIFIED },
      { personId: "3", fullName: "Caio", status: ATTENDANCE.ABSENT },
      { personId: "4", fullName: "Davi", status: null },
    ];
    const summary = summarizeCheckInItems(items, 0);

    expect(CHECK_IN_MEMBER_FILTERS).toEqual(["all", "pending", "present", "absent", "justified"]);
    expect(checkInFilterLabel("absent")).toBe("Ausentes");
    expect(checkInFilterCount(summary, "all")).toBe(4);
    expect(checkInFilterCount(summary, "pending")).toBe(1);
    expect(filterCheckInItems(items, "pending").map((item) => item.fullName)).toEqual(["Davi"]);
    expect(filterCheckInItems(items, "present").map((item) => item.fullName)).toEqual(["Ana"]);
    expect(filterCheckInItems(items, "absent").map((item) => item.fullName)).toEqual(["Caio"]);
    expect(filterCheckInItems(items, "justified").map((item) => item.fullName)).toEqual(["Bia"]);
    expect(checkInFilteredEmptyMessage("absent")).toContain("ausência");
  });


  it("keeps mode-specific confirmation params", () => {
    expect(checkInConfirmationParam("register")).toBe("registrada");
    expect(checkInConfirmationParam("adjust")).toBe("atualizada");
  });
});
