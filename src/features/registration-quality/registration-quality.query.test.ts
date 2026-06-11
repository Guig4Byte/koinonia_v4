import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { GroupResponsibilityRole, MembershipRole, PersonStatus, UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getRegistrationQualitySummary } from "@/features/registration-quality/registration-quality.query";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    person: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

type PrismaMock = {
  person: { findMany: Mock };
  user: { findMany: Mock };
};

const prismaMock = prisma as unknown as PrismaMock;

describe("registration quality query", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("recusa papéis sem escopo de pastor/admin antes de consultar dados", async () => {
    await expect(
      getRegistrationQualitySummary({
        id: "leader-1",
        churchId: "church-1",
        role: UserRole.LEADER,
      }),
    ).rejects.toThrow("getRegistrationQualitySummary requires pastor or admin scope");

    expect(prismaMock.person.findMany).not.toHaveBeenCalled();
    expect(prismaMock.user.findMany).not.toHaveBeenCalled();
  });

  it("consulta apenas dados da igreja do usuário com escopo total", async () => {
    prismaMock.person.findMany.mockResolvedValue([{ fullName: "Adriana Cidade", phone: "+5521888888888" }]);
    prismaMock.user.findMany.mockResolvedValue([{ email: "adriana@example.com", personId: "person-1" }]);

    const summary = await getRegistrationQualitySummary({
      id: "pastor-1",
      churchId: "church-1",
      role: UserRole.PASTOR,
    });

    expect(summary.hasIssues).toBe(false);
    expect(prismaMock.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          churchId: "church-1",
          status: { not: PersonStatus.INACTIVE },
        },
      }),
    );
    expect(prismaMock.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          churchId: "church-1",
          isActive: true,
        },
      }),
    );
  });
  it("inclui responsabilidades ativas da pessoa para descrever vínculo de liderança ou supervisão", async () => {
    prismaMock.person.findMany.mockResolvedValue([
      {
        id: "person-1",
        fullName: "Cibeli",
        phone: "+5521999999999",
        memberships: [],
        user: {
          groupResponsibilities: [
            {
              role: GroupResponsibilityRole.SUPERVISOR,
              group: { id: "group-1", name: "Célula Semear" },
            },
          ],
        },
      },
    ]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const summary = await getRegistrationQualitySummary({
      id: "pastor-1",
      churchId: "church-1",
      role: UserRole.PASTOR,
    });

    expect(prismaMock.person.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          status: true,
          user: {
            select: {
              role: true,
              groupResponsibilities: expect.objectContaining({
                where: {
                  churchId: "church-1",
                  activeUntil: null,
                  group: { is: { isActive: true } },
                },
              }),
            },
          },
          memberships: expect.objectContaining({
            where: { leftAt: null },
            select: {
              role: true,
              group: { select: { id: true, name: true } },
            },
          }),
        }),
      }),
    );
    expect(summary.issues.find((issue) => issue.key === "possiblyIncompleteName")?.items).toEqual([
      expect.objectContaining({ title: "Cibeli", detail: "Supervisor · Acompanha 1 célula" }),
    ]);
  });

  it("mapeia status, papel da membresia e papel do usuário sem depender de label traduzida", async () => {
    prismaMock.person.findMany.mockResolvedValue([
      {
        id: "visitor-1",
        fullName: "Visitante Betel",
        phone: null,
        status: PersonStatus.ACTIVE,
        memberships: [
          {
            role: MembershipRole.VISITOR,
            group: { id: "group-1", name: "Célula Semear" },
          },
        ],
        user: {
          role: UserRole.LEADER,
          groupResponsibilities: [],
        },
      },
    ]);
    prismaMock.user.findMany.mockResolvedValue([]);

    const summary = await getRegistrationQualitySummary({
      id: "pastor-1",
      churchId: "church-1",
      role: UserRole.PASTOR,
    });

    expect(summary.issues.find((issue) => issue.key === "missingPhone")?.items).toEqual([
      expect.objectContaining({ title: "Visitante Betel", detail: "Líder · Célula Semear" }),
    ]);
  });

});
