import { describe, expect, it } from "vitest";
import { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import {
  buildPeoplePageMembers,
  buildPeoplePageView,
  memberPriorityRank,
  peoplePageMembersSectionDetail,
  peoplePageNavIndicator,
  type PeoplePagePerson,
  type PeoplePageSignal,
} from "./people-page-view";

const viewer = { id: "leader-1", role: UserRole.LEADER };

function person(overrides: Partial<PeoplePagePerson> = {}): PeoplePagePerson {
  return {
    id: overrides.id ?? "person-1",
    fullName: overrides.fullName ?? "Ana",
    status: overrides.status ?? PersonStatus.ACTIVE,
    memberships: overrides.memberships ?? [{ group: { name: "Célula Central" } }],
  };
}

function signal(overrides: Partial<PeoplePageSignal> = {}): PeoplePageSignal {
  return {
    id: overrides.id ?? "signal-1",
    personId: overrides.personId ?? "person-1",
    severity: overrides.severity ?? SignalSeverity.ATTENTION,
    assignedToId: overrides.assignedToId ?? null,
    assignedTo: overrides.assignedTo ?? null,
    reason: overrides.reason ?? "Ausência recente sem justificativa registrada.",
    detectedAt: overrides.detectedAt ?? new Date("2026-05-01T12:00:00.000Z"),
  };
}

describe("people-page-view", () => {
  it("resolve indicador da navegação por atenção e cuidado", () => {
    expect(peoplePageNavIndicator({ attentionCount: 1, inCareCount: 1 })).toBe("attention");
    expect(peoplePageNavIndicator({ attentionCount: 0, inCareCount: 1 })).toBe("care");
    expect(peoplePageNavIndicator({ attentionCount: 0, inCareCount: 0 })).toBeUndefined();
  });

  it("ordena membros por prioridade pastoral e nome", () => {
    const members = buildPeoplePageMembers({
      viewer,
      people: [
        person({ id: "active", fullName: "Zeca" }),
        person({ id: "care", fullName: "Bruno", status: PersonStatus.COOLING_AWAY }),
        person({ id: "urgent", fullName: "Ana" }),
      ],
      attentionSignals: [signal({ personId: "urgent", severity: SignalSeverity.URGENT })],
      inCarePeople: [person({ id: "care", status: PersonStatus.COOLING_AWAY })],
    });

    expect(members.map((member) => member.id)).toEqual(["urgent", "care", "active"]);
    expect(members[0]).toMatchObject({ badgeLabel: "Urgente", priorityRank: 1 });
    expect(members[1]).toMatchObject({ subtitle: "Já recebeu cuidado e segue no radar.", priorityRank: 4 });
  });

  it("calcula prioridade por tipo de sinal e cuidado", () => {
    expect(memberPriorityRank({ signal: signal({ severity: SignalSeverity.URGENT }), personStatus: PersonStatus.ACTIVE, isInCare: false, viewer })).toBe(1);
    expect(memberPriorityRank({ signal: signal(), personStatus: PersonStatus.ACTIVE, isInCare: false, viewer })).toBe(3);
    expect(memberPriorityRank({ personStatus: PersonStatus.COOLING_AWAY, isInCare: false, viewer })).toBe(4);
    expect(memberPriorityRank({ personStatus: PersonStatus.ACTIVE, isInCare: false, viewer })).toBe(5);
  });

  it("monta detalhe da seção conforme filtro", () => {
    expect(peoplePageMembersSectionDetail({ activeFilter: "todos", membersCount: 3, priorityMembersCount: 2, visibleMembersForFilterCount: 3 })).toBe("3 membros · 2 no radar");
    expect(peoplePageMembersSectionDetail({ activeFilter: "ativos", membersCount: 3, priorityMembersCount: 2, visibleMembersForFilterCount: 1 })).toBe("1 pessoa neste recorte");
  });

  it("separa membros prioritários e regulares no view model", () => {
    const view = buildPeoplePageView({
      viewer,
      activeFilter: "todos",
      people: [
        person({ id: "active", fullName: "Ativo" }),
        person({ id: "care", fullName: "Cuidado", status: PersonStatus.COOLING_AWAY }),
      ],
      attentionSignals: [],
      inCarePeople: [person({ id: "care", status: PersonStatus.COOLING_AWAY })],
    });

    expect(view.navIndicator).toBe("care");
    expect(view.priorityMembers.map((member) => member.id)).toEqual(["care"]);
    expect(view.regularMembers.map((member) => member.id)).toEqual(["active"]);
  });
});
