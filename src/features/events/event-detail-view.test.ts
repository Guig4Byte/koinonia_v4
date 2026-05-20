import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/generated/prisma/client";
import {
  buildEventDetailState,
  buildEventPastoralCue,
  buildEventReadOnlyAttendanceView,
  eventAttendanceStatusTone,
  eventReadOnlyEmptyMessage,
  savedPresenceMessage,
} from "@/features/events/event-detail-view";

describe("event-detail-view", () => {
  it("groups read-only members by pastoral attention before listing present members", () => {
    const view = buildEventReadOnlyAttendanceView([
      { personId: "3", fullName: "Carlos", currentStatus: AttendanceStatus.PRESENT },
      { personId: "1", fullName: "Ana", currentStatus: AttendanceStatus.ABSENT },
      { personId: "2", fullName: "Bruno", currentStatus: AttendanceStatus.JUSTIFIED },
      { personId: "4", fullName: "Daniel", currentStatus: null },
    ]);

    expect(view.memberTotalLabel).toBe("4 membros");
    expect(view.memberBreakdownLabel).toBe("1 presente · 1 ausente · 1 justificou · 1 pendente");
    expect(view.memberSummary).toBe("4 membros · 1 presente · 1 ausente · 1 justificou · 1 pendente");
    expect(view.hasPriorityAttention).toBe(true);
    expect(view.pastoralCue).toMatchObject({
      title: "Presença incompleta",
      tone: "warn",
    });
    expect(view.groups.map((group) => group.members.map((member) => member.fullName))).toEqual([
      ["Ana"],
      ["Bruno"],
      ["Daniel"],
    ]);
    expect(view.presentMembers.map((member) => member.fullName)).toEqual(["Carlos"]);
  });

  it("builds a pastoral cue from attendance exceptions", () => {
    expect(buildEventPastoralCue({ absent: 1, justified: 1, pending: 0 })).toMatchObject({
      title: "Olhar depois do encontro",
      tone: "risk",
    });
    expect(buildEventPastoralCue({ absent: 0, justified: 1, pending: 0 })).toMatchObject({
      title: "Olhar depois do encontro",
      tone: "warn",
    });
    expect(buildEventPastoralCue({ absent: 0, justified: 0, pending: 0 })).toMatchObject({
      title: "Encontro sem sinais imediatos",
      tone: "ok",
    });
  });

  it("keeps neutral read-only messages for cancelled, future and pending encounters", () => {
    expect(eventReadOnlyEmptyMessage({ completed: false, isFutureEvent: true, isCancelled: false, closedLabel: "Sobre o encontro" })).toContain("ainda não começou");
    expect(eventReadOnlyEmptyMessage({ completed: false, isFutureEvent: false, isCancelled: false, closedLabel: "Sobre o encontro" })).toContain("líder da célula registra");
    expect(eventReadOnlyEmptyMessage({ completed: false, isFutureEvent: false, isCancelled: true, closedLabel: "Não houve encontro" })).toContain("não realizado");
  });

  it("derives event detail labels without duplicating page branching", () => {
    expect(buildEventDetailState({ status: "SCHEDULED", completed: false, isFutureEvent: false, canEditCheckIn: true, showCheckInForm: false })).toMatchObject({
      checkInLabel: "Resumo de presença",
      checkInSectionTitle: "Detalhes da presença",
      eventStatusLabel: "Presença pendente",
      eventStatusTone: "warn",
    });

    expect(buildEventDetailState({ status: "CANCELLED", completed: false, isFutureEvent: true, canEditCheckIn: false, showCheckInForm: false })).toMatchObject({
      checkInLabel: "Cancelado",
      checkInSectionTitle: "Sobre o encontro",
      eventStatusLabel: "Cancelado",
      eventStatusTone: "neutral",
    });
  });

  it("maps presence save query values to messages", () => {
    expect(savedPresenceMessage("registrada")).toContain("Presença registrada");
    expect(savedPresenceMessage("atualizada")).toContain("Presença atualizada");
    expect(savedPresenceMessage("outra")).toBeNull();
  });

  it("maps attendance statuses to visual tones", () => {
    expect(eventAttendanceStatusTone(AttendanceStatus.PRESENT)).toBe("ok");
    expect(eventAttendanceStatusTone(AttendanceStatus.JUSTIFIED)).toBe("warn");
    expect(eventAttendanceStatusTone(AttendanceStatus.ABSENT)).toBe("risk");
    expect(eventAttendanceStatusTone(null)).toBe("info");
  });
});
