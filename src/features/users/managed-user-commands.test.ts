import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  createManagedUserForChurch,
  resetManagedUserPasswordForChurch,
  updateManagedUserForChurch,
} from "./managed-user-commands";

const UserRole = {
  ADMIN: "ADMIN",
  PASTOR: "PASTOR",
  SUPERVISOR: "SUPERVISOR",
  LEADER: "LEADER",
} as const;

type UserFormValues = {
  name: string;
  email: string;
  role: (typeof UserRole)[keyof typeof UserRole];
  password?: string;
  personId: string | null;
  isActive: boolean;
};

const prismaMock = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  person: {
    findFirst: vi.fn(),
  },
}));

const hashPasswordMock = vi.hoisted(() => vi.fn(async (password: string) => `hashed:${password}`));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: hashPasswordMock,
}));

const admin: PermissionUser = {
  id: "admin-1",
  churchId: "church-1",
  role: UserRole.ADMIN,
};

const pastor: PermissionUser = {
  id: "pastor-1",
  churchId: "church-1",
  role: UserRole.PASTOR,
};

function userValues(overrides: Partial<UserFormValues> = {}): UserFormValues {
  return {
    name: "Irmã Ana",
    email: "ana@koinonia.local",
    role: UserRole.LEADER,
    password: "senha-segura",
    personId: "person-1",
    isActive: true,
    ...overrides,
  };
}

describe("managed user commands", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1", role: UserRole.LEADER, isActive: true });
    prismaMock.user.create.mockResolvedValue({ id: "created-user-1" });
    prismaMock.user.update.mockResolvedValue({ id: "managed-user-1" });
    prismaMock.person.findFirst.mockResolvedValue({ user: null });
    hashPasswordMock.mockImplementation(async (password: string) => `hashed:${password}`);
  });

  it("creates a user inside the viewer church with a hashed password", async () => {
    await expect(createManagedUserForChurch(admin, userValues())).resolves.toEqual({
      ok: true,
      userId: "created-user-1",
    });

    expect(hashPasswordMock).toHaveBeenCalledWith("senha-segura");
    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        churchId: admin.churchId,
        name: "Irmã Ana",
        email: "ana@koinonia.local",
        role: UserRole.LEADER,
        isActive: true,
        passwordHash: "hashed:senha-segura",
        personId: "person-1",
      },
      select: { id: true },
    });
  });

  it("blocks creation when the email already belongs to another user", async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: "existing-user-1" });

    await expect(createManagedUserForChurch(admin, userValues())).resolves.toEqual({
      ok: false,
      error: "email-em-uso",
    });

    expect(prismaMock.person.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("blocks creation when the selected person is missing from the church or already linked", async () => {
    prismaMock.person.findFirst.mockResolvedValue(null);

    await expect(createManagedUserForChurch(admin, userValues())).resolves.toEqual({
      ok: false,
      error: "pessoa-indisponivel",
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();

    prismaMock.person.findFirst.mockResolvedValue({ user: { id: "other-user-1" } });

    await expect(createManagedUserForChurch(admin, userValues())).resolves.toEqual({
      ok: false,
      error: "pessoa-indisponivel",
    });
    expect(prismaMock.person.findFirst).toHaveBeenLastCalledWith({
      where: { id: "person-1", churchId: admin.churchId },
      select: { user: { select: { id: true } } },
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("updates only users from the viewer church", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(updateManagedUserForChurch(admin, "other-church-user", userValues())).resolves.toEqual({
      ok: false,
      error: "usuario-nao-encontrado",
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: "other-church-user", churchId: admin.churchId },
      select: { id: true, role: true, isActive: true },
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("blocks update when the email belongs to another user", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1", role: UserRole.LEADER, isActive: true });
    prismaMock.user.findUnique.mockResolvedValue({ id: "other-user-1" });

    await expect(updateManagedUserForChurch(admin, "managed-user-1", userValues())).resolves.toEqual({
      ok: false,
      error: "email-em-uso",
    });

    expect(prismaMock.person.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("allows update when the email still belongs to the managed user", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1", role: UserRole.LEADER, isActive: true });
    prismaMock.user.findUnique.mockResolvedValue({ id: "managed-user-1" });

    await expect(updateManagedUserForChurch(admin, "managed-user-1", userValues())).resolves.toEqual({
      ok: true,
      userId: "managed-user-1",
    });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "managed-user-1" },
      data: {
        name: "Irmã Ana",
        email: "ana@koinonia.local",
        role: UserRole.LEADER,
        isActive: true,
        person: { connect: { id: "person-1" } },
      },
      select: { id: true },
    });
  });

  it("blocks update when the selected person is unavailable to the managed user", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1", role: UserRole.LEADER, isActive: true });
    prismaMock.person.findFirst.mockResolvedValue({ user: { id: "other-user-1" } });

    await expect(updateManagedUserForChurch(admin, "managed-user-1", userValues())).resolves.toEqual({
      ok: false,
      error: "pessoa-indisponivel",
    });

    expect(prismaMock.person.findFirst).toHaveBeenCalledWith({
      where: { id: "person-1", churchId: admin.churchId },
      select: { user: { select: { id: true } } },
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("preserves the viewer role and active status when the viewer edits their own user", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: admin.id, role: UserRole.ADMIN, isActive: true });

    await expect(
      updateManagedUserForChurch(
        admin,
        admin.id,
        userValues({ role: UserRole.LEADER, isActive: false, personId: null }),
      ),
    ).resolves.toEqual({ ok: true, userId: admin.id });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: admin.id },
      data: {
        name: "Irmã Ana",
        email: "ana@koinonia.local",
        role: UserRole.ADMIN,
        isActive: true,
        person: { disconnect: true },
      },
      select: { id: true },
    });
  });

  it("allows an admin or pastor to update another user's role, status and person link", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1", role: UserRole.LEADER, isActive: true });

    await expect(
      updateManagedUserForChurch(
        pastor,
        "managed-user-1",
        userValues({ role: UserRole.SUPERVISOR, isActive: false, personId: null }),
      ),
    ).resolves.toEqual({ ok: true, userId: "managed-user-1" });

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "managed-user-1" },
      data: {
        name: "Irmã Ana",
        email: "ana@koinonia.local",
        role: UserRole.SUPERVISOR,
        isActive: false,
        person: { disconnect: true },
      },
      select: { id: true },
    });
  });

  it("blocks password reset for the viewer's own user before reading or writing data", async () => {
    await expect(resetManagedUserPasswordForChurch(admin, admin.id, "nova-senha")).resolves.toEqual({
      ok: false,
      error: "senha-propria",
    });

    expect(prismaMock.user.findFirst).not.toHaveBeenCalled();
    expect(hashPasswordMock).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("resets passwords only for users from the viewer church", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(resetManagedUserPasswordForChurch(admin, "other-church-user", "nova-senha")).resolves.toEqual({
      ok: false,
      error: "usuario-nao-encontrado",
    });

    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { id: "other-church-user", churchId: admin.churchId },
      select: { id: true },
    });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("hashes and saves a new password for another managed user", async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: "managed-user-1" });

    await expect(resetManagedUserPasswordForChurch(admin, "managed-user-1", "nova-senha")).resolves.toEqual({
      ok: true,
      userId: "managed-user-1",
    });

    expect(hashPasswordMock).toHaveBeenCalledWith("nova-senha");
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "managed-user-1" },
      data: { passwordHash: "hashed:nova-senha" },
      select: { id: true },
    });
  });
});
