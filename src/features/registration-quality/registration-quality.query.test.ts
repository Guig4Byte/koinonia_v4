import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { PersonStatus, UserRole } from "@/generated/prisma/client";
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
});
