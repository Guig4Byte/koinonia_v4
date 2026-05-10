import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { buildPastoralPulseMessage } from ".";

describe("pastoral pulse", () => {
  it("uses a collective leader message when more than one urgent care exists", () => {
    const message = buildPastoralPulseMessage({
      viewerRole: UserRole.LEADER,
      scope: "leaderDashboard",
      counts: { urgentOrPastoral: 3 },
      subjects: { urgentOrPastoral: { personName: "Fábio Teixeira" } },
    });

    expect(message.title).toBe("3 irmãos pedem cuidado mais próximo.");
    expect(message.title).not.toContain("Fábio Teixeira");
  });

  it("uses a specific leader message when there is only one care in focus", () => {
    const message = buildPastoralPulseMessage({
      viewerRole: UserRole.LEADER,
      scope: "leaderDashboard",
      counts: { attention: 1 },
      subjects: { attention: { personName: "Raquel Soares" } },
    });

    expect(message.title).toBe("Raquel Soares pede uma aproximação simples.");
  });

  it("uses a mixed message when states are combined", () => {
    const message = buildPastoralPulseMessage({
      viewerRole: UserRole.SUPERVISOR,
      scope: "supervisorDashboard",
      counts: { support: 1, attention: 2, inCare: 1 },
    });

    expect(message.title).toBe("Há cuidados em momentos diferentes.");
  });

  it("does not turn support requests into the pastor dashboard pulse", () => {
    const message = buildPastoralPulseMessage({
      viewerRole: UserRole.PASTOR,
      scope: "pastorDashboard",
      counts: { urgentOrPastoral: 0, support: 3 },
    });

    expect(message.title).toBe("Nenhum caso pastoral urgente ou encaminhado agora.");
  });
});
