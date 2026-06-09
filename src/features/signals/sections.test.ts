import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import { getPastoralSectionSignalsByPerson, sortSignalsForPastoralViewer, splitPastoralSections } from "./sections";

const baseDate = new Date("2026-01-10T12:00:00.000Z");

function signal({
  id,
  personId,
  severity = SignalSeverity.ATTENTION,
  assignedToId = null,
  assignedToRole,
  detectedAt = baseDate,
}: {
  id: string;
  personId: string;
  severity?: SignalSeverity;
  assignedToId?: string | null;
  assignedToRole?: UserRole;
  detectedAt?: Date;
}) {
  return {
    id,
    personId,
    severity,
    assignedToId,
    detectedAt,
    assignedTo: assignedToRole ? { role: assignedToRole } : null,
  };
}

function daysAfter(days: number) {
  return new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
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

  it("deduplicates a person into the most specific pastoral section before recency", () => {
    const sections = splitPastoralSections({
      viewer: { id: "supervisor-1", role: UserRole.SUPERVISOR },
      signals: [
        signal({ id: "local-newer", personId: "person-1", detectedAt: daysAfter(2) }),
        signal({ id: "support-older", personId: "person-1", assignedToId: "supervisor-1", assignedToRole: UserRole.SUPERVISOR, detectedAt: daysAfter(1) }),
        signal({ id: "pastoral-older", personId: "person-2", assignedToRole: UserRole.PASTOR, detectedAt: daysAfter(1) }),
        signal({ id: "local-newest", personId: "person-2", detectedAt: daysAfter(3) }),
      ],
      inCarePeople: [],
    });

    expect(sections.urgentOrPastoralCases.map((item) => item.id)).toEqual(["pastoral-older"]);
    expect(sections.supportRequests.map((item) => item.id)).toEqual(["support-older"]);
    expect(sections.localAttention).toHaveLength(0);
  });

  it("uses severity and recency inside the same pastoral section", () => {
    const selected = getPastoralSectionSignalsByPerson(
      [
        signal({ id: "older-attention", personId: "person-1", detectedAt: daysAfter(1) }),
        signal({ id: "newer-attention", personId: "person-1", detectedAt: daysAfter(2) }),
        signal({ id: "urgent-older", personId: "person-2", severity: SignalSeverity.URGENT, detectedAt: daysAfter(1) }),
        signal({ id: "pastoral-newer", personId: "person-2", assignedToRole: UserRole.PASTOR, detectedAt: daysAfter(3) }),
      ],
      { id: "pastor-1", role: UserRole.PASTOR },
    );

    expect(selected.map((item) => item.id)).toEqual(["urgent-older", "newer-attention"]);
  });


  it("sorts signals by pastoral priority before recency for a viewer", () => {
    const ordered = sortSignalsForPastoralViewer(
      [
        signal({ id: "local-newest", personId: "person-1", detectedAt: daysAfter(3) }),
        signal({ id: "support-older", personId: "person-1", assignedToId: "supervisor-1", assignedToRole: UserRole.SUPERVISOR, detectedAt: daysAfter(1) }),
        signal({ id: "pastoral-older", personId: "person-1", assignedToRole: UserRole.PASTOR, detectedAt: daysAfter(2) }),
      ],
      { id: "supervisor-1", role: UserRole.SUPERVISOR },
    );

    expect(ordered.map((item) => item.id)).toEqual(["pastoral-older", "support-older", "local-newest"]);
  });

  it("keeps people in care out of signal sections", () => {
    const sections = splitPastoralSections({
      viewer: { id: "leader-1", role: UserRole.LEADER },
      signals: [
        signal({ id: "legacy-attention", personId: "person-1" }),
        signal({ id: "current-attention", personId: "person-4" }),
      ],
      inCarePeople: [
        { id: "person-1", status: PersonStatus.COOLING_AWAY },
        { id: "person-2", status: PersonStatus.COOLING_AWAY },
        { id: "person-2", status: PersonStatus.COOLING_AWAY },
        { id: "person-3", status: PersonStatus.ACTIVE },
      ],
    });

    expect(sections.localAttention.map((item) => item.id)).toEqual(["current-attention"]);
    expect([...sections.activeAttentionPersonIds]).toEqual(["person-4"]);
    expect(sections.inCarePeople.map((person) => person.id)).toEqual(["person-1", "person-2"]);
  });
});
