import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AttendanceStatus,
  EventStatus,
  MembershipRole,
  PersonStatus,
  SignalStatus,
  UserRole,
} from "@/generated/prisma/client";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  eventCheckInPayloadSchema,
  registerEventCheckIn,
  type EventCheckInPayload,
} from "./check-in-command";

const prismaMock = vi.hoisted(() => ({
  event: {
    findUnique: vi.fn(),
  },
  attendance: {
    findMany: vi.fn(),
  },
  groupMembership: {
    findMany: vi.fn(),
  },
  careSignal: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const txMock = vi.hoisted(() => ({
  attendance: {
    upsert: vi.fn(),
    create: vi.fn(),
  },
  person: {
    create: vi.fn(),
  },
  groupMembership: {
    create: vi.fn(),
  },
  event: {
    update: vi.fn(),
  },
}));

const canCheckInEventMock = vi.hoisted(() => vi.fn());
const recalculateAttendanceSignalsForGroupMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/permissions/permissions", () => ({
  canCheckInEvent: canCheckInEventMock,
}));

vi.mock("@/features/signals/rules", () => ({
  recalculateAttendanceSignalsForGroup:
    recalculateAttendanceSignalsForGroupMock,
}));

const user: PermissionUser = {
  id: "user-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

const event = {
  id: "event-1",
  churchId: "church-1",
  groupId: "group-1",
  startsAt: new Date("2026-05-30T18:00:00.000Z"),
  status: EventStatus.SCHEDULED,
  group: {
    id: "group-1",
    churchId: "church-1",
    isActive: true,
    responsibilities: [],
  },
};

const validPayload: EventCheckInPayload = {
  attendances: [
    {
      personId: "11111111-1111-4111-8111-111111111111",
      status: AttendanceStatus.PRESENT,
    },
    {
      personId: "22222222-2222-4222-8222-222222222222",
      status: AttendanceStatus.ABSENT,
    },
  ],
  visitors: [],
};

const activeMemberships = validPayload.attendances.map((attendance) => ({
  personId: attendance.personId,
}));

describe("event check-in command", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.event.findUnique.mockResolvedValue(event);
    prismaMock.attendance.findMany.mockResolvedValue([]);
    prismaMock.groupMembership.findMany.mockResolvedValue(activeMemberships);
    prismaMock.careSignal.findMany.mockResolvedValue([
      { personId: "person-with-signal" },
    ]);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback(txMock),
    );
    canCheckInEventMock.mockReturnValue(true);
    recalculateAttendanceSignalsForGroupMock.mockResolvedValue(undefined);
    txMock.person.create.mockResolvedValue({ id: "visitor-person-1" });
  });

  it("parses visitors as an optional check-in payload field", () => {
    expect(
      eventCheckInPayloadSchema.parse({
        attendances: validPayload.attendances,
      }),
    ).toEqual(validPayload);
  });

  it("returns 404 without writing when the event does not exist", async () => {
    prismaMock.event.findUnique.mockResolvedValue(null);

    await expect(
      registerEventCheckIn(user, "missing-event", validPayload),
    ).resolves.toEqual({
      ok: false,
      message: "Evento não encontrado",
      status: 404,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("returns 403 without writing when the user cannot check in the event", async () => {
    canCheckInEventMock.mockReturnValue(false);

    await expect(
      registerEventCheckIn(user, event.id, validPayload),
    ).resolves.toEqual({
      ok: false,
      message:
        "A presença deste encontro fica disponível para a liderança da célula",
      status: 403,
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("validates the payload against active non-visitor memberships before writing", async () => {
    prismaMock.groupMembership.findMany.mockResolvedValue([
      { personId: validPayload.attendances[0].personId },
    ]);

    await expect(
      registerEventCheckIn(user, event.id, validPayload),
    ).resolves.toEqual({
      ok: false,
      message: "A presença contém irmão fora desta célula",
      status: 400,
    });
    expect(prismaMock.groupMembership.findMany).toHaveBeenCalledWith({
      where: {
        groupId: event.groupId,
        leftAt: null,
        role: { not: MembershipRole.VISITOR },
      },
      select: { personId: true },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicate visitors already recorded in the same event before writing", async () => {
    prismaMock.attendance.findMany.mockResolvedValue([
      { person: { fullName: "João Ávila" } },
    ]);

    await expect(
      registerEventCheckIn(user, event.id, {
        ...validPayload,
        visitors: [{ fullName: "joao avila" }],
      }),
    ).resolves.toEqual({
      ok: false,
      message: "joao avila já está registrado como visitante neste encontro.",
      status: 400,
    });
    expect(prismaMock.attendance.findMany).toHaveBeenCalledWith({
      where: { eventId: event.id, status: AttendanceStatus.VISITOR },
      include: { person: true },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("records member attendances, visitors and closes the event in one transaction", async () => {
    const result = await registerEventCheckIn(user, event.id, {
      ...validPayload,
      visitors: [{ fullName: "Visitante Novo", phone: "11999999999" }],
    });

    expect(result).toEqual({ ok: true, data: { openSignalPeopleCount: 1 } });
    expect(txMock.attendance.upsert).toHaveBeenCalledTimes(2);
    expect(txMock.attendance.upsert).toHaveBeenCalledWith({
      where: {
        eventId_personId: {
          eventId: event.id,
          personId: validPayload.attendances[0].personId,
        },
      },
      create: {
        eventId: event.id,
        personId: validPayload.attendances[0].personId,
        status: AttendanceStatus.PRESENT,
      },
      update: { status: AttendanceStatus.PRESENT, markedAt: expect.any(Date) },
    });
    expect(txMock.person.create).toHaveBeenCalledWith({
      data: {
        churchId: user.churchId,
        fullName: "Visitante Novo",
        phone: "11999999999",
        status: PersonStatus.VISITOR,
        shortNote: "Visitante registrado no check-in.",
      },
    });
    expect(txMock.groupMembership.create).toHaveBeenCalledWith({
      data: {
        groupId: event.groupId,
        personId: "visitor-person-1",
        role: MembershipRole.VISITOR,
      },
    });
    expect(txMock.attendance.create).toHaveBeenCalledWith({
      data: {
        eventId: event.id,
        personId: "visitor-person-1",
        status: AttendanceStatus.VISITOR,
      },
    });
    expect(txMock.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: { status: EventStatus.COMPLETED },
    });
    expect(recalculateAttendanceSignalsForGroupMock).toHaveBeenCalledWith(
      event.groupId,
      txMock,
    );
    expect(prismaMock.careSignal.findMany).toHaveBeenCalledWith({
      where: {
        churchId: user.churchId,
        groupId: event.groupId,
        status: SignalStatus.OPEN,
      },
      distinct: ["personId"],
      select: { personId: true },
    });
  });
});
