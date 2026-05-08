import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/generated/prisma/client";
import {
  attendanceTone,
  buildPersonPresenceView,
  recentPresenceCountLabel,
  recentPresenceTrendLabel,
} from "./person-detail-view";

describe("person detail view helpers", () => {
  it("ignores visitors in the recent presence view", () => {
    const view = buildPersonPresenceView([
      attendance("1", AttendanceStatus.VISITOR),
      attendance("2", AttendanceStatus.PRESENT),
      attendance("3", AttendanceStatus.ABSENT),
    ]);

    expect(view.recentAttendances.map((item) => item.id)).toEqual(["2", "3"]);
    expect(view.recentPresence.accountableCount).toBe(2);
    expect(view.recentPresence.presentCount).toBe(1);
  });

  it("summarizes only the four most recent accountable attendances", () => {
    const view = buildPersonPresenceView([
      attendance("1", AttendanceStatus.PRESENT),
      attendance("2", AttendanceStatus.PRESENT),
      attendance("3", AttendanceStatus.ABSENT),
      attendance("4", AttendanceStatus.JUSTIFIED),
      attendance("5", AttendanceStatus.PRESENT),
    ]);

    expect(view.recentAttendances.map((item) => item.id)).toEqual(["1", "2", "3", "4"]);
    expect(view.hiddenAttendancesCount).toBe(1);
  });

  it("keeps labels and tones pastoral and explicit", () => {
    expect(attendanceTone(AttendanceStatus.PRESENT)).toBe("ok");
    expect(attendanceTone(AttendanceStatus.JUSTIFIED)).toBe("warn");
    expect(attendanceTone(AttendanceStatus.ABSENT)).toBe("risk");
    expect(recentPresenceCountLabel(0, 3)).toBe("Nenhuma presença em 3 encontros");
    expect(recentPresenceCountLabel(3, 3)).toBe("Presente em todos os 3 encontros");
    expect(recentPresenceTrendLabel({ direction: "up", delta: 12 }, "warn")).toBe(
      "Presença mais constante que nos encontros anteriores.",
    );
  });
});

function attendance(id: string, status: AttendanceStatus) {
  return {
    id,
    status,
    event: {
      id: `event-${id}`,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      group: { name: "Célula" },
    },
  };
}
