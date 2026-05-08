import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildGroupMemberDisplays,
  buildGroupMembersView,
  groupMeetingText,
  groupMemberPriorityRank,
  groupMembersSectionDetail,
  type GroupDetailMembership,
  type GroupDetailSignal,
  type GroupDetailViewer,
} from "./group-detail-view";

const viewer: GroupDetailViewer = { id: "leader-1", role: UserRole.LEADER };

function signal(overrides: Partial<GroupDetailSignal> = {}): GroupDetailSignal {
  return {
    id: "signal-1",
    personId: "person-1",
    severity: SignalSeverity.ATTENTION,
    assignedToId: null,
    assignedTo: null,
    detectedAt: new Date("2026-01-01T12:00:00Z"),
    reason: "Ausência recente",
    evidence: null,
    source: null,
    ...overrides,
  };
}

function membership(id: string, fullName: string, status: PersonStatus): GroupDetailMembership {
  return {
    id: `membership-${id}`,
    personId: `person-${id}`,
    person: { fullName, status },
  };
}

describe("groupMeetingText", () => {
  it("formats default day and time", () => {
    expect(groupMeetingText(3, "19:30")).toBe("Quarta · 19:30");
  });

  it("keeps a useful empty state when there is no fixed schedule", () => {
    expect(groupMeetingText(null, null)).toBe("Encontro sem horário fixo informado.");
  });
});

describe("groupMemberPriorityRank", () => {
  it("keeps urgent or pastoral signals at the top", () => {
    expect(groupMemberPriorityRank(signal({ severity: SignalSeverity.URGENT }), PersonStatus.ACTIVE, viewer)).toBe(1);
  });

  it("keeps in-care people before active people when there is no open signal", () => {
    expect(groupMemberPriorityRank(undefined, PersonStatus.COOLING_AWAY, viewer)).toBe(4);
    expect(groupMemberPriorityRank(undefined, PersonStatus.ACTIVE, viewer)).toBe(5);
  });
});

describe("buildGroupMemberDisplays", () => {
  it("sorts people by pastoral priority before name", () => {
    const attentionSignal = signal({ personId: "person-2" });
    const members = buildGroupMemberDisplays({
      memberships: [
        membership("1", "Bruno", PersonStatus.ACTIVE),
        membership("2", "Ana", PersonStatus.ACTIVE),
        membership("3", "Camila", PersonStatus.COOLING_AWAY),
      ],
      attentionSignalsByPersonId: new Map([[attentionSignal.personId, attentionSignal]]),
      viewer,
    });

    expect(members.map((member) => member.name)).toEqual(["Ana", "Camila", "Bruno"]);
  });
});

describe("buildGroupMembersView", () => {
  it("separates priority members from regular members", () => {
    const members = [
      { membershipId: "1", personId: "1", name: "Ana", badgeLabel: "Em atenção", badgeTone: "warn" as const, priorityRank: 3, status: PersonStatus.ACTIVE },
      { membershipId: "2", personId: "2", name: "Bruno", badgeLabel: "Ativo", badgeTone: "ok" as const, priorityRank: 5, status: PersonStatus.ACTIVE },
    ];

    const view = buildGroupMembersView(members, "todos");

    expect(view.priorityMembers).toHaveLength(1);
    expect(view.regularMembers).toHaveLength(1);
    expect(view.sectionDetail).toBe("2 membros · 1 em atenção");
  });

  it("uses the filtered count when the selected filter is not todos", () => {
    expect(groupMembersSectionDetail({ totalCount: 10, priorityCount: 2, visibleCount: 1, activeFilter: "em-cuidado" })).toBe("1 pessoa neste recorte");
  });
});
