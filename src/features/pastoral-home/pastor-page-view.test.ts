import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { buildPastorPageView, type PastorPageDashboard, type PastorPageSignal } from "./pastor-page-view";

const user = { id: "pastor-1", role: UserRole.PASTOR };

function signal(overrides: Partial<PastorPageSignal> = {}): PastorPageSignal {
  return {
    id: overrides.id ?? "signal-1",
    personId: overrides.personId ?? "person-1",
    reason: overrides.reason ?? "Ausência recente",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    assignedToId: overrides.assignedToId,
    assignedTo: overrides.assignedTo,
    person: overrides.person ?? { id: "person-1", fullName: "Maria" },
    group: overrides.group ?? { name: "Célula Central" },
    detectedAt: overrides.detectedAt,
  };
}

function dashboard(overrides: Partial<PastorPageDashboard> = {}): PastorPageDashboard {
  return {
    attentionPeople: overrides.attentionPeople ?? [],
    inCarePeople: overrides.inCarePeople ?? [],
    weeklyPresence: overrides.weeklyPresence ?? {
      hasPresenceData: false,
      presenceRate: 0,
      recordedEventsCount: 0,
    },
  };
}

describe("pastor-page-view", () => {
  it("prioriza casos pastorais e monta indicador de risco", () => {
    const view = buildPastorPageView({
      dashboard: dashboard({
        attentionPeople: [signal({ severity: SignalSeverity.URGENT })],
        inCarePeople: [{ id: "person-2", fullName: "Ana", status: PersonStatus.COOLING_AWAY }],
      }),
      user,
    });

    expect(view.navIndicator).toBe("risk");
    expect(view.urgentOrPastoralCases).toHaveLength(1);
    expect(view.inCarePeople).toHaveLength(1);
    expect(view.pastoralPulse.tone).toBe("attention");
  });

  it("monta resumo neutro quando ainda não há presença semanal", () => {
    const view = buildPastorPageView({ dashboard: dashboard(), user });

    expect(view.presenceSummary).toEqual([
      {
        label: "Presença da semana",
        value: "—",
        detail: "Nenhum encontro registrado nesta semana.",
        tone: "neutral",
      },
    ]);
  });

  it("usa tom pastoral da presença registrada", () => {
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 60, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("risk");
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 70, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("warn");
    expect(buildPastorPageView({ dashboard: dashboard({ weeklyPresence: { hasPresenceData: true, presenceRate: 85, recordedEventsCount: 1 } }), user }).presenceSummary[0].tone).toBe("ok");
  });
});
