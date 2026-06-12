import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  updateCareVisiblePersonBirthday,
  updateCareVisiblePersonPhone,
} from "@/features/people/person-profile-commands";

const UserRole = {
  LEADER: "LEADER",
} as const;

const prismaMock = vi.hoisted(() => ({
  person: {
    update: vi.fn(),
  },
}));

const requireCareVisiblePersonMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/care/person-care-access", () => ({
  requireCareVisiblePerson: requireCareVisiblePersonMock,
}));

const user: PermissionUser = {
  id: "user-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

describe("person profile commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireCareVisiblePersonMock.mockResolvedValue({
      ok: true,
      person: { id: "person-db-1" },
    });
  });

  it("updates the phone only after confirming the person is visible for care", async () => {
    prismaMock.person.update.mockResolvedValue({
      id: "person-db-1",
      phone: "(21) 99999-9999",
    });

    await expect(updateCareVisiblePersonPhone(user, "person-route-1", "(21) 99999-9999")).resolves.toEqual({
      ok: true,
      data: {
        personId: "person-db-1",
        phone: "(21) 99999-9999",
        message: "Telefone salvo.",
      },
    });

    expect(requireCareVisiblePersonMock).toHaveBeenCalledWith(user, "person-route-1", {
      forbiddenMessage: "Este irmão não está disponível para atualização no seu acesso",
    });
    expect(prismaMock.person.update).toHaveBeenCalledWith({
      where: { id: "person-db-1" },
      data: { phone: "(21) 99999-9999" },
      select: { id: true, phone: true },
    });
  });

  it("does not update the phone when care visibility blocks access", async () => {
    requireCareVisiblePersonMock.mockResolvedValue({
      ok: false,
      status: 403,
      message: "Sem permissão.",
    });

    await expect(updateCareVisiblePersonPhone(user, "person-route-1", "(21) 99999-9999")).resolves.toEqual({
      ok: false,
      status: 403,
      message: "Sem permissão.",
    });

    expect(prismaMock.person.update).not.toHaveBeenCalled();
  });

  it("updates the birthday and returns the saved feedback message", async () => {
    const birthDate = new Date("1992-05-14T00:00:00.000Z");
    prismaMock.person.update.mockResolvedValue({
      id: "person-db-1",
      birthDate,
    });

    await expect(updateCareVisiblePersonBirthday(user, "person-route-1", birthDate)).resolves.toEqual({
      ok: true,
      data: {
        personId: "person-db-1",
        birthDate,
        message: "Aniversário salvo no perfil da pessoa.",
      },
    });

    expect(prismaMock.person.update).toHaveBeenCalledWith({
      where: { id: "person-db-1" },
      data: { birthDate },
      select: { id: true, birthDate: true },
    });
  });

  it("updates the birthday with null and returns the removed feedback message", async () => {
    prismaMock.person.update.mockResolvedValue({
      id: "person-db-1",
      birthDate: null,
    });

    await expect(updateCareVisiblePersonBirthday(user, "person-route-1", null)).resolves.toEqual({
      ok: true,
      data: {
        personId: "person-db-1",
        birthDate: null,
        message: "Aniversário removido do perfil da pessoa.",
      },
    });
  });

  it("does not update the birthday when care visibility blocks access", async () => {
    requireCareVisiblePersonMock.mockResolvedValue({
      ok: false,
      status: 404,
      message: "Pessoa não encontrada.",
    });

    await expect(updateCareVisiblePersonBirthday(user, "person-route-1", null)).resolves.toEqual({
      ok: false,
      status: 404,
      message: "Pessoa não encontrada.",
    });

    expect(prismaMock.person.update).not.toHaveBeenCalled();
  });
});
