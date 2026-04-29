import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "../../generated/prisma/client";
import { splitPastoralSections } from "./sections";

function signal({
  id,
  personId,
  severity = SignalSeverity.ATTENTION,
  assignedToId = null,
  assignedToRole,
}: {
  id: string;
  personId: string;
  severity?: SignalSeverity;
  assignedToId?: string | null;
  assignedToRole?: UserRole;
}) {
  return {
    id,
    personId,
    severity,
    assignedToId,
    assignedTo: assignedToRole ? { role: assignedToRole } : null,
  };
}

describe("pastoral sections", () => {
  it("keeps the most specific section priority for signals", () => {
    const sections = splitPastoralSections({
      viewer: { id: "supervisor-1", role: UserRole.SUPERVISOR },
      signals: [
        signal({ id: "urgent-support", personId: "person-1", severity: SignalSeverity.URGENT, assignedToId: "supervisor-1", assignedToRole: UserRole.SUPERVISOR }),
        signal({ id: "support", personId: "person-2", assignedToId: "supervisor-1", assignedToRole: UserRole.SUPERVISOR }),
        signal({ id: "attention", personId: "person-3" }),
      ],
      inCarePeople: [],
    });

    expect(sections.urgentOrPastoralCases.map((item) => item.id)).toEqual(["urgent-support"]);
    expect(sections.supportRequests.map((item) => item.id)).toEqual(["support"]);
    expect(sections.localAttention.map((item) => item.id)).toEqual(["attention"]);
  });

  it("shows people in care only when they have no active attention signal", () => {
    const sections = splitPastoralSections({
      viewer: { id: "leader-1", role: UserRole.LEADER },
      signals: [signal({ id: "attention", personId: "person-1" })],
      inCarePeople: [
        { id: "person-1", status: PersonStatus.COOLING_AWAY },
        { id: "person-2", status: PersonStatus.COOLING_AWAY },
        { id: "person-2", status: PersonStatus.COOLING_AWAY },
        { id: "person-3", status: PersonStatus.ACTIVE },
      ],
    });

    expect(sections.inCarePeople.map((person) => person.id)).toEqual(["person-2"]);
  });
});
