import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  groupPastoralEscalatedCount,
  groupPastoralPriorityScore,
  groupPastoralStatusKey,
  groupRiskCount,
  groupSupportRequestsCount,
  groupUrgentCount,
  hasLowPresence,
  teamGroupPastoralPriorityScore,
  teamGroupStatusLabel,
} from "./group-pastoral-priority";

describe("group pastoral priority", () => {
  it("separa urgentes automáticos de casos encaminhados ao pastor", () => {
    const group = {
      signals: [
        { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.PASTOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: null },
      ],
      hasPresenceData: true,
      presenceRate: 80,
    };

    expect(groupUrgentCount(group)).toBe(1);
    expect(groupPastoralEscalatedCount(group)).toBe(1);
    expect(groupSupportRequestsCount(group)).toBe(1);
    expect(groupRiskCount(group)).toBe(2);
  });

  it("classifica a saúde pastoral por precedência única", () => {
    expect(groupPastoralStatusKey({ urgentCount: 1, pastoralCasesCount: 1, supportRequestsCount: 1, hasPresenceData: true, presenceRate: 90 })).toBe("urgent");
    expect(groupPastoralStatusKey({ pastoralCasesCount: 1, supportRequestsCount: 1, hasPresenceData: true, presenceRate: 90 })).toBe("pastoralCase");
    expect(groupPastoralStatusKey({ supportRequestsCount: 1, attentionCount: 1, hasPresenceData: true, presenceRate: 90 })).toBe("supportRequest");
    expect(groupPastoralStatusKey({ localAttentionCount: 1, hasPresenceData: true, presenceRate: 90 })).toBe("localAttention");
    expect(groupPastoralStatusKey({ hasPresenceData: true, presenceRate: 60 })).toBe("localAttention");
    expect(groupPastoralStatusKey({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 1 })).toBe("withoutRecentPresence");
    expect(groupPastoralStatusKey({ hasPresenceData: false, presenceRate: 0, recordedEventsCount: 0 })).toBe("stable");
    expect(groupPastoralStatusKey({ hasPresenceData: true, presenceRate: 90 })).toBe("stable");
  });

  it("mantém score pastoral com uma fonte de pesos", () => {
    const score = groupPastoralPriorityScore({
      signals: [
        { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.PASTOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.PASTOR } },
      ],
      supportRequestsCount: 2,
      attentionCount: 5,
      inCareCount: 1,
      hasPresenceData: false,
      presenceRate: 0,
      recordedEventsCount: 1,
    });

    expect(score).toBe(1200 + 1000 + 2 * 700 + 1 * 400 + 1 * 200 + 25);
  });

  it("mantém status da equipe em uma função central", () => {
    expect(hasLowPresence({ hasPresenceData: true, presenceRate: 69 })).toBe(true);
    expect(teamGroupPastoralPriorityScore({ urgentCount: 1, pastoralCasesCount: 1, supportRequestsCount: 1, localAttentionCount: 1, hasPresenceData: true, presenceRate: 60 })).toBe(1200 + 1000 + 700 + 400 + 10);
    expect(teamGroupStatusLabel({ urgentCount: 0, pastoralCasesCount: 1, hasNoPresenceData: false, hasLowPresence: false })).toBe("1 encaminhado");
    expect(teamGroupStatusLabel({ urgentCount: 0, pastoralCasesCount: 0, supportRequestsCount: 2, hasNoPresenceData: false, hasLowPresence: false })).toBe("2 pedidos de apoio");
    expect(teamGroupStatusLabel({ urgentCount: 0, pastoralCasesCount: 0, hasNoPresenceData: true, hasLowPresence: false })).toBe("Retomar contato");
  });
});
