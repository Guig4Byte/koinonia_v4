import { describe, expect, it, vi } from "vitest";
import { GroupResponsibilityRole, MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { buildPersonDetailPageData } from "./person-detail.view-model";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    smallGroup: { findFirst: vi.fn() },
  },
}));

const CHURCH_ID = "church-1";

function viewer(role: UserRole = UserRole.PASTOR) {
  return {
    id: "viewer-1",
    churchId: CHURCH_ID,
    personId: null,
    name: "Pastor Local",
    email: "pastor.local@example.com",
    role,
  };
}

function responsibility(role: GroupResponsibilityRole, userId: string, name: string) {
  return {
    id: `${role}-${userId}`,
    churchId: CHURCH_ID,
    userId,
    role,
    activeUntil: null,
    user: { id: userId, name },
  };
}

function group(id: string, name: string) {
  return {
    id,
    churchId: CHURCH_ID,
    name,
    isActive: true,
    responsibilities: [
      responsibility(GroupResponsibilityRole.LEADER, "leader-1", "Líder Ana"),
      responsibility(GroupResponsibilityRole.SUPERVISOR, "supervisor-1", "Supervisor Bruno"),
    ],
  };
}

function groupResponsibility(role: GroupResponsibilityRole, groupValue: ReturnType<typeof group>) {
  return {
    id: `${role}-${groupValue.id}`,
    churchId: CHURCH_ID,
    userId: "person-user-1",
    groupId: groupValue.id,
    role,
    activeUntil: null,
    group: groupValue,
  };
}

function membership(groupValue: ReturnType<typeof group>, role: MembershipRole = MembershipRole.MEMBER) {
  return {
    id: `membership-${groupValue.id}`,
    churchId: CHURCH_ID,
    personId: "person-1",
    groupId: groupValue.id,
    role,
    joinedAt: new Date("2026-01-01T00:00:00.000Z"),
    leftAt: null,
    group: groupValue,
  };
}

function context(overrides: Record<string, unknown> = {}) {
  const { person: personOverrides, ...contextOverrides } = overrides;

  return {
    user: viewer(),
    person: {
      id: "person-1",
      churchId: CHURCH_ID,
      fullName: "Irmão Teste",
      phone: null,
      birthDate: null,
      status: PersonStatus.ACTIVE,
      memberships: [],
      user: null,
      ...(personOverrides as object | undefined),
    },
    signals: [],
    attendances: [],
    careTouches: [],
    visibleMemberships: [],
    ...contextOverrides,
  } as unknown as Parameters<typeof buildPersonDetailPageData>[0];
}

describe("person-detail.view-model", () => {
  it("exibe pastor e admin como perfil de liderança sem forçar seções pessoais", () => {
    const pastorData = buildPersonDetailPageData(context({
      person: {
        user: { id: "person-user-1", name: "Pastor Local", role: UserRole.PASTOR, groupResponsibilities: [] },
      },
    }));
    const adminData = buildPersonDetailPageData(context({
      person: {
        user: { id: "person-user-1", name: "Admin Local", role: UserRole.ADMIN, groupResponsibilities: [] },
      },
    }));

    expect(pastorData.hero.profileEyebrow).toBe("Perfil de liderança");
    expect(pastorData.hero.badgeKind).toBe("leadership");
    expect(pastorData.hero.metaLines).toEqual(["Pastor"]);
    expect(pastorData.leadership).toMatchObject({
      roleLabel: "Pastor",
      detail: "Acompanha a igreja e suas células.",
      groups: [],
    });
    expect(pastorData.profile.showPersonalPastoralSections).toBe(false);

    expect(adminData.hero.badgeKind).toBe("leadership");
    expect(adminData.hero.metaLines).toEqual(["Admin"]);
    expect(adminData.leadership).toMatchObject({
      roleLabel: "Admin",
      detail: "Acesso administrativo e pastoral completo.",
      groups: [],
    });
  });

  it("usa a classificação centralizada para montar perfil de supervisor", () => {
    const semear = group("group-1", "Célula Semear");
    const vida = group("group-2", "Célula Vida");
    const data = buildPersonDetailPageData(context({
      person: {
        user: {
          id: "person-user-1",
          name: "Supervisor Bruno",
          role: UserRole.SUPERVISOR,
          groupResponsibilities: [
            groupResponsibility(GroupResponsibilityRole.SUPERVISOR, vida),
            groupResponsibility(GroupResponsibilityRole.SUPERVISOR, semear),
          ],
        },
      },
    }));

    expect(data.hero.metaLines).toEqual(["Supervisor · Acompanha 2 células"]);
    expect(data.leadership).toMatchObject({
      roleLabel: "Supervisor",
      detail: "Acompanha 2 células.",
      groupsTitle: "Células acompanhadas",
      hiddenGroupsCount: 0,
    });
    expect(data.leadership?.groups.map((item) => item.name)).toEqual(["Célula Semear", "Célula Vida"]);
  });

  it("usa a classificação centralizada para montar perfil de líder", () => {
    const semear = group("group-1", "Célula Semear");
    const data = buildPersonDetailPageData(context({
      person: {
        user: {
          id: "person-user-1",
          name: "Líder Ana",
          role: UserRole.LEADER,
          groupResponsibilities: [groupResponsibility(GroupResponsibilityRole.LEADER, semear)],
        },
      },
    }));

    expect(data.hero.metaLines).toEqual(["Líder · Célula Semear"]);
    expect(data.leadership).toMatchObject({
      roleLabel: "Líder",
      detail: "Lidera Célula Semear.",
      groupsTitle: "Célula liderada",
      hiddenGroupsCount: 0,
    });
    expect(data.leadership?.groups).toHaveLength(1);
  });

  it("mantém seção Como irmão quando uma liderança também tem contexto pastoral pessoal", () => {
    const semear = group("group-1", "Célula Semear");
    const data = buildPersonDetailPageData(context({
      person: {
        user: {
          id: "person-user-1",
          name: "Líder Ana",
          role: UserRole.LEADER,
          groupResponsibilities: [groupResponsibility(GroupResponsibilityRole.LEADER, semear)],
        },
      },
      visibleMemberships: [membership(semear)],
    }));

    expect(data.hero.badgeKind).toBe("leadership");
    expect(data.profile.showPersonalPastoralSections).toBe(true);
    expect(data.profile.personalSectionTitle).toBe("Como irmão");
    expect(data.profile.personalSectionDetail).toBe("Dados pessoais de cuidado, sem repetir a visão do escopo de liderança.");
  });

  it("preserva o perfil pastoral comum para irmão sem responsabilidade de liderança", () => {
    const semear = group("group-1", "Célula Semear");
    const data = buildPersonDetailPageData(context({
      person: { memberships: [membership(semear)] },
      visibleMemberships: [membership(semear)],
    }));

    expect(data.hero.profileEyebrow).toBe("Perfil pastoral");
    expect(data.hero.badgeKind).toBe("pastoral");
    expect(data.hero.metaLines).toEqual(["Membro", "Célula Semear"]);
    expect(data.leadership).toBeNull();
    expect(data.profile.showPersonalPastoralSections).toBe(true);
    expect(data.profile.personalSectionTitle).toBeNull();
  });
});
