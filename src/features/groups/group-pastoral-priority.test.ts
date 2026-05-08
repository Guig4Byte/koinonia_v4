import { describe, expect, it } from "vitest";
import { SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  groupPastoralEscalatedCount,
  groupPastoralPriorityScore,
  groupRiskCount,
  groupUrgentCount,
  hasLowPresence,
  teamGroupPastoralPriorityScore,
  teamGroupStatusLabel,
} from "./group-pastoral-priority";

describe("group pastoral priority", () => {
  it("keeps signal counts explicit and reusable", () => {
    const group = {
      signals: [
        { severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.PASTOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: { role: UserRole.SUPERVISOR } },
        { severity: SignalSeverity.ATTENTION, assignedTo: null },
      ],
      hasPresenceData: true,
      presenceRate: 80,
    };

    expect(groupUrgentCount(group)).toBe(1);
    expect(groupPastoralEscalatedCount(group)).toBe(1);
    expect(groupRiskCount(group)).toBe(1);
  });

  it("preserves the supervisor cell ordering score without local magic numbers", () => {
    const score = groupPastoralPriorityScore({
      signals: [{ severity: SignalSeverity.URGENT, assignedTo: { role: UserRole.PASTOR } }],
      supportRequestsCount: 2,
      attentionCount: 4,
      inCareCount: 1,
      hasPresenceData: false,
      presenceRate: 0,
    });

    expect(score).toBe(1200 + 1000 + 2 * 700 + 1 * 400 + 1 * 200 + 25);
  });

  it("keeps team overview presence status in one place", () => {
    expect(hasLowPresence({ hasPresenceData: true, presenceRate: 69 })).toBe(true);
    expect(teamGroupPastoralPriorityScore({ urgentCount: 1, pastoralCasesCount: 2, hasPresenceData: true, presenceRate: 60 })).toBe(1000 + 700 + 110);
    expect(teamGroupStatusLabel({ urgentCount: 0, pastoralCasesCount: 0, hasNoPresenceData: true, hasLowPresence: false })).toBe("Sem presença recente");
  });
});
