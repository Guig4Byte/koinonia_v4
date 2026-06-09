import { describe, expect, it } from "vitest";
import { AttendanceStatus, EventStatus, PersonStatus, SignalSeverity, SignalSource, UserRole } from "@/generated/prisma/client";
import {
  buildLeaderNextPastoralAction,
  buildLeaderPageView,
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
      primaryGroupId: "group-1",
      attentionPeople: [attention, support, urgent],
      inCarePeople: [inCare, hiddenInCare],
      currentEvent: null,
      hasRecordedMeetings: true,
    };
    const view = buildLeaderPageView({ dashboard, viewer });

    expect(view.urgentSignals.map((item) => item.id)).toEqual(["urgent"]);
    expect(view.supportSignals.map((item) => item.id)).toEqual(["support"]);
    expect(view.attentionSignals.map((item) => item.id)).toEqual(["attention"]);
    expect(view.inCarePeople.map((item) => item.id)).toEqual(["care-person"]);
    expect(view.hasPeopleInRadar).toBe(true);
    expect(view.navIndicator).toBe("risk");
  });

  it("mostra estado de primeiro uso quando a célula ainda não tem encontros registrados", () => {
    const view = buildLeaderPageView({
      dashboard: {
        primaryGroupId: "group-1",
        attentionPeople: [],
        inCarePeople: [],
        currentEvent: null,
        hasRecordedMeetings: false,
      },
      viewer,
    });

    expect(view.firstUseState).toMatchObject({
      title: "Sua célula está pronta.",
      detail: "Registre o primeiro encontro para começar o acompanhamento.",
      href: "/celulas/group-1",
      label: "Abrir célula",
    });
    expect(view.nextAction).toBeNull();
    expect(view.pastoralPulse.title).toBe("Sua célula está pronta para começar.");
  });

  it("leva o primeiro uso do líder para o encontro atual quando ele existe", () => {
    const view = buildLeaderPageView({
      dashboard: {
        primaryGroupId: "group-1",
        attentionPeople: [],
        inCarePeople: [],
        currentEvent: {
          id: "event-current",
          startsAt: new Date("2026-05-08T12:00:00.000Z"),
          status: EventStatus.CHECKIN_OPEN,
          attendances: [],
          group: { name: "Célula Central", locationName: "Casa da Ana" },
        },
        hasRecordedMeetings: false,
      },
      viewer,
    });

    expect(view.firstUseState).toMatchObject({
      href: "/eventos/event-current",
      label: "Registrar presença",
    });
    expect(view.nextAction).toBeNull();
  });

  it("destaca o próximo check-in como ação principal do líder", () => {
    const action = buildLeaderNextPastoralAction({
      primaryGroupId: "group-1",
      currentEvent: {
        id: "event-current",
        startsAt: new Date("2026-05-08T23:00:00.000Z"),
        status: EventStatus.CHECKIN_OPEN,
        attendances: [],
        group: { name: "Célula Central", locationName: "Casa da Ana" },
      },
    });

    expect(action).toMatchObject({
      eyebrow: "Próximo encontro",
      title: "08 mai, 20:00",
      detail: "Célula Central · Casa da Ana. Registre a presença quando o encontro acontecer.",
      href: "/eventos/event-current",
      label: "Registrar presença",
      tone: "presence",
    });
  });

  it("destaca o resumo quando a presença do encontro já foi registrada", () => {
    const action = buildLeaderNextPastoralAction({
      primaryGroupId: "group-1",
      currentEvent: {
        id: "event-current",
        startsAt: new Date("2026-05-08T23:00:00.000Z"),
        status: EventStatus.SCHEDULED,
        attendances: [{ status: AttendanceStatus.PRESENT }],
        group: { name: "Célula Central", locationName: "Casa da Ana" },
      },
    });

    expect(action).toMatchObject({
      eyebrow: "Resumo do encontro",
      title: "08 mai, 20:00",
      detail: "Célula Central · Casa da Ana. A presença já foi registrada; confira o resumo se precisar ajustar algo.",
      href: "/eventos/event-current",
      label: "Ver resumo",
      tone: "ok",
    });
  });

  it("leva o líder para a célula quando não há encontro atual", () => {
    expect(buildLeaderNextPastoralAction({ primaryGroupId: "group-1", currentEvent: null })).toMatchObject({
      eyebrow: "Rotina da célula",
      title: "Nenhum encontro disponível para registro.",
      href: "/celulas/group-1",
      label: "Ver célula",
      tone: "ok",
    });
  });
});
