import { describe, expect, it } from "vitest";
import { AttendanceStatus, EventStatus, PersonStatus, SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import {
  buildLeaderPageView,
  leaderCurrentEventState,
  leaderNavIndicator,
  type LeaderPageInCarePerson,
  type LeaderPageSignal,
  type LeaderPageViewer,
} from "./leader-page-view";

const viewer: LeaderPageViewer = { id: "leader-1", role: UserRole.LEADER };

function person(id: string, fullName = `Pessoa ${id}`): LeaderPageInCarePerson {
  return { id, fullName, status: PersonStatus.COOLING_AWAY };
}

function signal(overrides: Partial<LeaderPageSignal> = {}): LeaderPageSignal {
  const id = overrides.id ?? "signal-1";

  return {
    id,
    personId: overrides.personId ?? "person-1",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    assignedToId: overrides.assignedToId,
    assignedTo: overrides.assignedTo ?? null,
    detectedAt: overrides.detectedAt ?? new Date("2026-05-08T12:00:00.000Z"),
    reason: overrides.reason ?? "Ausência recente sem justificativa registrada.",
    evidence: overrides.evidence ?? null,
    source: overrides.source ?? SignalSource.ATTENDANCE,
    pastoralEscalationActorName: overrides.pastoralEscalationActorName ?? null,
    person: overrides.person ?? { id: overrides.personId ?? "person-1", fullName: "Maria" },
  };
}

describe("leader-page-view", () => {
  it("resolve indicador da navegação por prioridade pastoral", () => {
    expect(leaderNavIndicator({ urgentCount: 1, attentionCount: 5, inCareCount: 2 })).toBe("risk");
    expect(leaderNavIndicator({ urgentCount: 0, attentionCount: 1, inCareCount: 2 })).toBe("attention");
    expect(leaderNavIndicator({ urgentCount: 0, attentionCount: 0, inCareCount: 2 })).toBe("care");
    expect(leaderNavIndicator({ urgentCount: 0, attentionCount: 0, inCareCount: 0 })).toBeUndefined();
  });

  it("separa sinais e pessoas em cuidado para a visão do líder", () => {
    const urgent = signal({ id: "urgent", personId: "urgent-person", severity: SignalSeverity.URGENT });
    const support = signal({
      id: "support",
      personId: "support-person",
      assignedToId: "supervisor-1",
      assignedTo: { role: UserRole.SUPERVISOR },
    });
    const attention = signal({ id: "attention", personId: "attention-person" });
    const inCare = person("care-person", "Ana");
    const hiddenInCare = person("attention-person", "Pessoa em atenção");

    const dashboard = {
      attentionPeople: [attention, support, urgent],
      inCarePeople: [inCare, hiddenInCare],
      currentEvent: null,
    };
    const view = buildLeaderPageView({ dashboard, viewer });

    expect(view.urgentSignals.map((item) => item.id)).toEqual(["urgent"]);
    expect(view.supportSignals.map((item) => item.id)).toEqual(["support"]);
    expect(view.attentionSignals.map((item) => item.id)).toEqual(["attention"]);
    expect(view.inCarePeople.map((item) => item.id)).toEqual(["care-person"]);
    expect(view.hasPeopleInRadar).toBe(true);
    expect(view.navIndicator).toBe("risk");
  });

  it("monta estado do encontro atual com presença pendente ou registrada", () => {
    const pending = leaderCurrentEventState({
      id: "event-1",
      startsAt: new Date("2026-05-08T12:00:00.000Z"),
      status: EventStatus.CHECKIN_OPEN,
      attendances: [],
      group: { name: "Célula Central", locationName: "Casa da Ana" },
    });

    expect(pending).toMatchObject({
      groupName: "Célula Central",
      locationName: "Casa da Ana",
      badgeLabel: "Presença pendente",
      badgeTone: "warn",
      ctaLabel: "Registrar presença",
    });

    const completed = leaderCurrentEventState({
      id: "event-2",
      startsAt: new Date("2026-05-08T12:00:00.000Z"),
      status: EventStatus.SCHEDULED,
      locationName: "Local deste encontro",
      attendances: [{ status: AttendanceStatus.PRESENT }],
      group: { name: null, locationName: "Local padrão" },
    });

    expect(completed).toMatchObject({
      groupName: "Célula",
      locationName: "Local deste encontro",
      badgeLabel: "Presença registrada",
      badgeTone: "ok",
      ctaLabel: "Ver resumo",
    });
  });
});
