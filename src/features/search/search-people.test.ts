import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionUser } from "@/features/permissions/permissions";
import { searchVisiblePeople } from "./search-people";

const { GroupResponsibilityRole, UserRole } = vi.hoisted(() => ({
  GroupResponsibilityRole: {
    LEADER: "LEADER",
    SUPERVISOR: "SUPERVISOR",
  } as const,
  UserRole: {
    LEADER: "LEADER",
  } as const,
}));

const prismaMock = vi.hoisted(() => ({
  person: {
    findMany: vi.fn(),
  },
}));

const canViewGroupMock = vi.hoisted(() => vi.fn(() => true));
const getVisibleMembershipWhereMock = vi.hoisted(() => vi.fn(() => ({ visibleMembership: true })));
const getVisibleOpenSignalWhereMock = vi.hoisted(() => vi.fn(() => ({ visibleSignal: true })));
const getVisiblePersonWhereMock = vi.hoisted(() => vi.fn(() => ({ visiblePerson: true })));
const getPastoralSectionSignalsByPersonMock = vi.hoisted(() => vi.fn(() => []));
const personDisplayContextMock = vi.hoisted(() => vi.fn(() => "Célula Esperança"));
type MockLeadershipBadge = { label: string; tone: "info" } | null;

const personLeadershipDisplayBadgeMock = vi.hoisted(() =>
  vi.fn((): MockLeadershipBadge => null),
);
const personEffectiveBadgeForViewerMock = vi.hoisted(() => vi.fn(() => ({
  label: "Sem sinal aberto",
  tone: "ok",
})));

vi.mock("@/generated/prisma/client", () => ({
  GroupResponsibilityRole,
  UserRole,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/permissions/permissions", () => ({
  canViewGroup: canViewGroupMock,
  getVisibleMembershipWhere: getVisibleMembershipWhereMock,
  getVisibleOpenSignalWhere: getVisibleOpenSignalWhereMock,
  getVisiblePersonWhere: getVisiblePersonWhereMock,
}));

vi.mock("@/features/signals/sections", () => ({
  getPastoralSectionSignalsByPerson: getPastoralSectionSignalsByPersonMock,
}));

vi.mock("@/features/people/person-display-context", () => ({
  personDisplayContext: personDisplayContextMock,
  personLeadershipDisplayBadge: personLeadershipDisplayBadgeMock,
}));

vi.mock("@/features/people/status-display", () => ({
  personEffectiveBadgeForViewer: personEffectiveBadgeForViewerMock,
}));

const user: PermissionUser = {
  id: "user-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

function searchPerson(overrides: Record<string, unknown> = {}) {
  return {
    id: "person-1",
    fullName: "Ana Maria",
    status: "ACTIVE",
    memberships: [
      {
        role: "MEMBER",
        group: { id: "group-1", name: "Célula Esperança", churchId: "church-1", isActive: true },
      },
    ],
    user: null,
    signals: [],
    ...overrides,
  };
}

describe("search people", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    canViewGroupMock.mockReturnValue(true);
    getVisibleMembershipWhereMock.mockReturnValue({ visibleMembership: true });
    getVisibleOpenSignalWhereMock.mockReturnValue({ visibleSignal: true });
    getVisiblePersonWhereMock.mockReturnValue({ visiblePerson: true });
    getPastoralSectionSignalsByPersonMock.mockReturnValue([]);
    personDisplayContextMock.mockReturnValue("Célula Esperança");
    personLeadershipDisplayBadgeMock.mockReturnValue(null);
    personEffectiveBadgeForViewerMock.mockReturnValue({ label: "Sem sinal aberto", tone: "ok" });
  });

  it("does not query Prisma when the search term is too short", async () => {
    await expect(searchVisiblePeople(user, " a ")).resolves.toEqual([]);

    expect(prismaMock.person.findMany).not.toHaveBeenCalled();
  });

  it("returns direct matches mapped to the public search result contract", async () => {
    const person = searchPerson();
    prismaMock.person.findMany.mockResolvedValueOnce([person]).mockResolvedValueOnce([]);

    await expect(searchVisiblePeople(user, " Ana ")).resolves.toEqual([
      {
        id: "person-1",
        fullName: "Ana Maria",
        context: "Célula Esperança",
        status: "Sem sinal aberto",
        statusTone: "ok",
      },
    ]);

    expect(prismaMock.person.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        AND: [
          { visiblePerson: true },
          { fullName: { contains: "Ana", mode: "insensitive" } },
        ],
      },
      include: expect.objectContaining({
        memberships: expect.objectContaining({ where: { visibleMembership: true }, take: 1 }),
        signals: expect.objectContaining({ where: { visibleSignal: true } }),
      }),
      orderBy: { fullName: "asc" },
      take: 8,
    });
    expect(personDisplayContextMock).toHaveBeenCalled();
    expect(personEffectiveBadgeForViewerMock).toHaveBeenCalledWith(person, undefined, user);
  });

  it("uses the accent-insensitive fallback without duplicating direct matches", async () => {
    const directPerson = searchPerson({ id: "person-direct", fullName: "Ana Maria" });
    const fallbackPerson = searchPerson({ id: "person-fallback", fullName: "José Silva" });

    prismaMock.person.findMany
      .mockResolvedValueOnce([directPerson])
      .mockResolvedValueOnce([
        { id: "person-skip", fullName: "Maria Souza" },
        { id: "person-fallback", fullName: "José Silva" },
      ])
      .mockResolvedValueOnce([fallbackPerson]);

    const results = await searchVisiblePeople(user, "Jose");

    expect(results.map((person) => person.id)).toEqual(["person-direct", "person-fallback"]);
    expect(prismaMock.person.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        AND: [
          { visiblePerson: true },
          { id: { notIn: ["person-direct"] } },
        ],
      },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
      take: 120,
    });
    expect(prismaMock.person.findMany).toHaveBeenNthCalledWith(3, {
      where: { id: { in: ["person-fallback"] } },
      include: expect.any(Object),
      orderBy: { fullName: "asc" },
    });
  });

  it("prefers a leadership badge when the person has visible responsibilities", async () => {
    personLeadershipDisplayBadgeMock.mockReturnValue({ label: "Líder", tone: "info" });
    prismaMock.person.findMany.mockResolvedValueOnce([
      searchPerson({
        user: {
          role: UserRole.LEADER,
          groupResponsibilities: [
            {
              role: GroupResponsibilityRole.LEADER,
              group: { id: "group-1", name: "Célula Esperança", churchId: "church-1", isActive: true },
            },
          ],
        },
      }),
    ]).mockResolvedValueOnce([]);

    await expect(searchVisiblePeople(user, "Ana")).resolves.toEqual([
      expect.objectContaining({ status: "Líder", statusTone: "info" }),
    ]);

    expect(canViewGroupMock).toHaveBeenCalledWith(user, {
      id: "group-1",
      name: "Célula Esperança",
      churchId: "church-1",
      isActive: true,
    });
    expect(personEffectiveBadgeForViewerMock).not.toHaveBeenCalled();
  });
});
