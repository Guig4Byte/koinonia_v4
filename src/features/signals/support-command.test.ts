import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CareKind,
  GroupResponsibilityRole,
  SignalSeverity,
  SignalStatus,
  UserRole,
} from "@/generated/prisma/client";
import type { PermissionUser } from "@/features/permissions/permissions";
import { SIGNAL_COPY } from "./signal-copy";
import { requestSignalSupport } from "./support-command";
import type { ParsedSignalSupportPayload } from "./support-payload";

const prismaMock = vi.hoisted(() => ({
  careSignal: {
    findUnique: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const txMock = vi.hoisted(() => ({
  careSignal: {
    update: vi.fn(),
  },
  careTouch: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const leader: PermissionUser = {
  id: "leader-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

const supervisor: PermissionUser = {
  id: "supervisor-1",
  churchId: "church-1",
  role: UserRole.SUPERVISOR,
};

const pastor: PermissionUser = {
  id: "pastor-1",
  churchId: "church-1",
  role: UserRole.PASTOR,
};

const unrelatedLeader: PermissionUser = {
  id: "leader-2",
  churchId: "church-1",
  role: UserRole.LEADER,
};

const requestSupervisorPayload: ParsedSignalSupportPayload = {
  action: "REQUEST_SUPERVISOR",
  note: "Preciso de apoio no acompanhamento.",
};

const escalatePastorPayload: ParsedSignalSupportPayload = {
  action: "ESCALATE_PASTOR",
  note: "Caso pastoral sensível.",
};

function responsibility(userId: string, role: GroupResponsibilityRole) {
  return { userId, role, activeUntil: null };
}

function signal(overrides: Record<string, unknown> = {}) {
  return {
    id: "signal-1",
    churchId: "church-1",
    personId: "person-1",
    groupId: "group-1",
    severity: SignalSeverity.ATTENTION,
    status: SignalStatus.OPEN,
    assignedToId: null,
    assignedTo: null,
    group: {
      id: "group-1",
      churchId: "church-1",
      isActive: true,
      responsibilities: [
        responsibility(leader.id, GroupResponsibilityRole.LEADER),
        responsibility(supervisor.id, GroupResponsibilityRole.SUPERVISOR),
      ],
    },
    ...overrides,
  };
}

describe("signal support command", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.careSignal.findUnique.mockResolvedValue(signal());
    prismaMock.user.findFirst.mockResolvedValue({
      id: pastor.id,
      name: "Pastora Ana",
      role: UserRole.PASTOR,
    });
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(txMock),
    );
    txMock.careSignal.update.mockImplementation(async ({ data }) => ({
      assignedToId: data.assignedToId,
      assignedTo: { name: "Responsável" },
    }));
  });

  it("returns 404 when the signal is missing, closed or outside the user's church", async () => {
    prismaMock.careSignal.findUnique.mockResolvedValue(null);

    await expect(
      requestSignalSupport({
        user: leader,
        signalId: "missing-signal",
        payload: requestSupervisorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.signalNotFound,
      status: 404,
    });

    prismaMock.careSignal.findUnique.mockResolvedValue(
      signal({ status: SignalStatus.RESOLVED }),
    );

    await expect(
      requestSignalSupport({
        user: leader,
        signalId: "closed-signal",
        payload: requestSupervisorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.signalNotFound,
      status: 404,
    });

    prismaMock.careSignal.findUnique.mockResolvedValue(
      signal({ churchId: "other-church" }),
    );

    await expect(
      requestSignalSupport({
        user: leader,
        signalId: "other-church-signal",
        payload: requestSupervisorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.signalNotFound,
      status: 404,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("blocks support actions when the user cannot view the signal group", async () => {
    await expect(
      requestSignalSupport({
        user: unrelatedLeader,
        signalId: "signal-1",
        payload: requestSupervisorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.noCarePermission,
      status: 403,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("allows the group leader to request supervisor support and records a care touch", async () => {
    const result = await requestSignalSupport({
      user: leader,
      signalId: "signal-1",
      payload: requestSupervisorPayload,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        assignedToId: supervisor.id,
        assignedToName: "Responsável",
        message: SIGNAL_COPY.support.requested.apiMessage,
      },
    });
    expect(txMock.careSignal.update).toHaveBeenCalledWith({
      where: { id: "signal-1" },
      data: { assignedToId: supervisor.id },
      include: { assignedTo: true },
    });
    expect(txMock.careTouch.create).toHaveBeenCalledWith({
      data: {
        churchId: leader.churchId,
        personId: "person-1",
        groupId: "group-1",
        actorId: leader.id,
        kind: CareKind.REQUESTED_SUPPORT,
        note: requestSupervisorPayload.note,
      },
    });
  });

  it("keeps supervisor support restricted to group leaders", async () => {
    await expect(
      requestSignalSupport({
        user: supervisor,
        signalId: "signal-1",
        payload: requestSupervisorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.leaderOnlySupervisorRequest,
      status: 403,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("allows the group supervisor to escalate the signal to a pastoral assignee", async () => {
    const result = await requestSignalSupport({
      user: supervisor,
      signalId: "signal-1",
      payload: escalatePastorPayload,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        assignedToId: pastor.id,
        assignedToName: "Responsável",
        message: SIGNAL_COPY.pastoralEscalation.apiMessage,
      },
    });
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      where: { churchId: supervisor.churchId, role: { in: [UserRole.PASTOR, UserRole.ADMIN] } },
      orderBy: { createdAt: "asc" },
    });
    expect(txMock.careSignal.update).toHaveBeenCalledWith({
      where: { id: "signal-1" },
      data: { assignedToId: pastor.id },
      include: { assignedTo: true },
    });
    expect(txMock.careTouch.create).toHaveBeenCalledWith({
      data: {
        churchId: supervisor.churchId,
        personId: "person-1",
        groupId: "group-1",
        actorId: supervisor.id,
        kind: CareKind.ESCALATED_TO_PASTOR,
        note: escalatePastorPayload.note,
      },
    });
  });

  it("blocks pastoral escalation when there is no pastoral assignee", async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    await expect(
      requestSignalSupport({
        user: supervisor,
        signalId: "signal-1",
        payload: escalatePastorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.noPastoralAssignee,
      status: 400,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("does not let whole-church viewers bypass escalation role rules", async () => {
    await expect(
      requestSignalSupport({
        user: pastor,
        signalId: "signal-1",
        payload: escalatePastorPayload,
      }),
    ).resolves.toEqual({
      ok: false,
      message: SIGNAL_COPY.errors.leaderOrSupervisorOnlyPastoralEscalation,
      status: 403,
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
