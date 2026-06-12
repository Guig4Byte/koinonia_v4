import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  markCareVisiblePersonActiveAfterCare,
  markPersonActiveAfterCare,
} from "@/features/care/person-status-actions";

const { PersonStatus, UserRole } = vi.hoisted(() => ({
  PersonStatus: {
    ACTIVE: "ACTIVE",
    COOLING_AWAY: "COOLING_AWAY",
  } as const,
  UserRole: {
    LEADER: "LEADER",
  } as const,
}));

const prismaMock = vi.hoisted(() => ({
  careSignal: {
    count: vi.fn(),
  },
  person: {
    updateMany: vi.fn(),
  },
}));

const requireCareVisiblePersonMock = vi.hoisted(() => vi.fn());
const getVisibleOpenSignalWhereMock = vi.hoisted(() => vi.fn());
const getOpenSignalInActiveGroupWhereMock = vi.hoisted(() => vi.fn());

vi.mock("@/generated/prisma/client", () => ({
  PersonStatus,
  UserRole,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/care/person-care-access", () => ({
  requireCareVisiblePerson: requireCareVisiblePersonMock,
}));

vi.mock("@/features/permissions/permissions", () => ({
  getVisibleOpenSignalWhere: getVisibleOpenSignalWhereMock,
  getOpenSignalInActiveGroupWhere: getOpenSignalInActiveGroupWhereMock,
}));

const user: PermissionUser = {
  id: "user-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

function mockNoOpenSignals() {
  prismaMock.careSignal.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
}

describe("person status actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requireCareVisiblePersonMock.mockResolvedValue({
      ok: true,
      person: { id: "person-db-1" },
    });
    getVisibleOpenSignalWhereMock.mockReturnValue({ churchId: "church-1", visible: true });
    getOpenSignalInActiveGroupWhereMock.mockReturnValue({ churchId: "church-1", activeGroup: true });
    prismaMock.person.updateMany.mockResolvedValue({ count: 1 });
  });

  it("requires care visibility before marking the person as active", async () => {
    mockNoOpenSignals();

    await expect(markCareVisiblePersonActiveAfterCare(user, "person-route-1")).resolves.toEqual({
      ok: true,
      data: { status: PersonStatus.ACTIVE },
    });

    expect(requireCareVisiblePersonMock).toHaveBeenCalledWith(user, "person-route-1", {
      forbiddenMessage: "Este irmão não está disponível para atualização no seu acesso",
    });
    expect(prismaMock.person.updateMany).toHaveBeenCalledWith({
      where: { id: "person-db-1", churchId: "church-1", status: PersonStatus.COOLING_AWAY },
      data: { status: PersonStatus.ACTIVE },
    });
  });

  it("does not check open signals or update the person when care visibility blocks access", async () => {
    requireCareVisiblePersonMock.mockResolvedValue({
      ok: false,
      status: 403,
      message: "Sem permissão.",
    });

    await expect(markCareVisiblePersonActiveAfterCare(user, "person-route-1")).resolves.toEqual({
      ok: false,
      status: 403,
      message: "Sem permissão.",
    });

    expect(prismaMock.careSignal.count).not.toHaveBeenCalled();
    expect(prismaMock.person.updateMany).not.toHaveBeenCalled();
  });

  it("marks the person as active when there are no open signals", async () => {
    mockNoOpenSignals();

    await expect(markPersonActiveAfterCare(user, "person-1")).resolves.toEqual({
      ok: true,
      data: { status: PersonStatus.ACTIVE },
    });

    expect(prismaMock.careSignal.count).toHaveBeenNthCalledWith(1, {
      where: { churchId: "church-1", visible: true, personId: "person-1" },
    });
    expect(prismaMock.careSignal.count).toHaveBeenNthCalledWith(2, {
      where: { churchId: "church-1", activeGroup: true, personId: "person-1" },
    });
    expect(prismaMock.person.updateMany).toHaveBeenCalledWith({
      where: { id: "person-1", churchId: "church-1", status: PersonStatus.COOLING_AWAY },
      data: { status: PersonStatus.ACTIVE },
    });
  });

  it("blocks marking active when there is an open signal in the visible scope", async () => {
    prismaMock.careSignal.count.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

    await expect(markPersonActiveAfterCare(user, "person-1")).resolves.toEqual({
      ok: false,
      status: 409,
      message:
        "Ainda há motivo de atenção aberto para este irmão. Antes de encerrar o acompanhamento, esse cuidado precisa ser registrado.",
    });

    expect(prismaMock.person.updateMany).not.toHaveBeenCalled();
  });

  it("blocks marking active when there is an open signal only outside the visible scope", async () => {
    prismaMock.careSignal.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    await expect(markPersonActiveAfterCare(user, "person-1")).resolves.toEqual({
      ok: false,
      status: 409,
      message:
        "Ainda há motivo de atenção aberto fora do seu recorte atual. A supervisão pode ajudar antes de encerrar o acompanhamento.",
    });

    expect(prismaMock.person.updateMany).not.toHaveBeenCalled();
  });
});
