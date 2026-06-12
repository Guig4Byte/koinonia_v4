import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventStatus, EventType, UserRole } from "@/generated/prisma/client";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  eventDetailsPayloadSchema,
  updateEventDetails,
  type EventDetailsPayload,
} from "./event-details-command";

const prismaMock = vi.hoisted(() => ({
  event: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
}));

const canManageEventDetailsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

vi.mock("@/features/permissions/permissions", () => ({
  canManageEventDetails: canManageEventDetailsMock,
}));

const user: PermissionUser = {
  id: "user-1",
  churchId: "church-1",
  role: UserRole.LEADER,
};

type EventFixture = {
  id: string;
  churchId: string;
  groupId: string;
  type: EventType;
  locationName: string | null;
  startsAt: Date;
  scheduleStartsAt: Date | null;
  status: EventStatus;
  group: {
    id: string;
    churchId: string;
    isActive: boolean;
    responsibilities: unknown[];
  };
  _count: { attendances: number };
};

const event: EventFixture = {
  id: "event-1",
  churchId: "church-1",
  groupId: "group-1",
  type: EventType.CELL_MEETING,
  locationName: "Casa da Ana",
  startsAt: new Date("2026-05-31T18:00:00.000Z"),
  scheduleStartsAt: null,
  status: EventStatus.SCHEDULED,
  group: {
    id: "group-1",
    churchId: "church-1",
    isActive: true,
    responsibilities: [],
  },
  _count: { attendances: 0 },
};

function eventWith(overrides: Partial<EventFixture> = {}) {
  return { ...event, ...overrides };
}

function payload(overrides: Partial<EventDetailsPayload> = {}): EventDetailsPayload {
  return { locationName: "Salão principal", ...overrides };
}

describe("event details command", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T12:00:00.000Z"));
    vi.clearAllMocks();

    prismaMock.event.findUnique.mockResolvedValue(event);
    prismaMock.event.findFirst.mockResolvedValue(null);
    prismaMock.event.update.mockImplementation(async ({ data }) => ({
      id: event.id,
      locationName: data.locationName ?? event.locationName,
      startsAt: data.startsAt ?? event.startsAt,
      status: data.status ?? event.status,
      scheduleStartsAt: data.scheduleStartsAt ?? event.scheduleStartsAt,
    }));
    canManageEventDetailsMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects empty event detail payloads", () => {
    expect(eventDetailsPayloadSchema.safeParse({}).success).toBe(false);
  });

  it("returns 404 without writing when the event does not exist in the user church", async () => {
    prismaMock.event.findUnique.mockResolvedValue(eventWith({ churchId: "other-church" }));

    await expect(
      updateEventDetails(user, event.id, payload()),
    ).resolves.toEqual({
      ok: false,
      message: "Encontro não encontrado",
      status: 404,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("returns 403 without writing when the user cannot manage the event", async () => {
    canManageEventDetailsMock.mockReturnValue(false);

    await expect(
      updateEventDetails(user, event.id, payload()),
    ).resolves.toEqual({
      ok: false,
      message: "Você não pode alterar este encontro",
      status: 403,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("updates the event location with trimmed text", async () => {
    const result = await updateEventDetails(user, event.id, {
      locationName: "  Casa nova  ",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        event: {
          id: event.id,
          locationName: "Casa nova",
          startsAt: event.startsAt,
          status: EventStatus.SCHEDULED,
          scheduleStartsAt: null,
        },
      },
    });
    expect(prismaMock.event.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: { locationName: "Casa nova" },
      select: {
        id: true,
        locationName: true,
        startsAt: true,
        status: true,
        scheduleStartsAt: true,
      },
    });
  });

  it("reschedules the event and detaches it from the generated schedule", async () => {
    const nextStartsAt = "2026-06-01T20:00:00.000Z";

    await expect(
      updateEventDetails(user, event.id, { startsAt: nextStartsAt }),
    ).resolves.toEqual({
      ok: true,
      data: {
        event: {
          id: event.id,
          locationName: event.locationName,
          startsAt: new Date(nextStartsAt),
          status: EventStatus.SCHEDULED,
          scheduleStartsAt: event.startsAt,
        },
      },
    });
    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        id: { not: event.id },
        groupId: event.groupId,
        type: event.type,
        startsAt: new Date(nextStartsAt),
      },
      select: { id: true },
    });
    expect(prismaMock.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          startsAt: new Date(nextStartsAt),
          generatedFromSchedule: false,
          scheduleStartsAt: event.startsAt,
          status: EventStatus.SCHEDULED,
        },
      }),
    );
  });

  it("uses the existing schedule anchor when rescheduling an already detached event", async () => {
    const scheduleStartsAt = new Date("2026-05-31T18:00:00.000Z");
    const detachedEvent = eventWith({
      startsAt: new Date("2026-06-01T18:00:00.000Z"),
      scheduleStartsAt,
    });
    prismaMock.event.findUnique.mockResolvedValue(detachedEvent);

    await updateEventDetails(user, event.id, {
      startsAt: "2026-06-02T20:00:00.000Z",
    });

    expect(prismaMock.event.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ scheduleStartsAt }),
      }),
    );
  });

  it("rejects rescheduling when attendances were already recorded", async () => {
    prismaMock.event.findUnique.mockResolvedValue(
      eventWith({ _count: { attendances: 1 } }),
    );

    await expect(
      updateEventDetails(user, event.id, {
        startsAt: "2026-06-01T20:00:00.000Z",
      }),
    ).resolves.toEqual({
      ok: false,
      message:
        "Este encontro já tem presença registrada e não está disponível para remarcação",
      status: 400,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("rejects rescheduling to a duplicated event date", async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: "event-2" });

    await expect(
      updateEventDetails(user, event.id, {
        startsAt: "2026-06-01T20:00:00.000Z",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Já existe um encontro desta célula neste dia e horário",
      status: 409,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("cancels future events without attendances", async () => {
    await expect(
      updateEventDetails(user, event.id, { status: EventStatus.CANCELLED }),
    ).resolves.toEqual({
      ok: true,
      data: {
        event: {
          id: event.id,
          locationName: event.locationName,
          startsAt: event.startsAt,
          status: EventStatus.CANCELLED,
          scheduleStartsAt: null,
        },
      },
    });
    expect(prismaMock.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: EventStatus.CANCELLED } }),
    );
  });

  it("requires past or current events to be marked as no meeting instead of cancelled", async () => {
    prismaMock.event.findUnique.mockResolvedValue(
      eventWith({ startsAt: new Date("2026-05-30T10:00:00.000Z") }),
    );

    await expect(
      updateEventDetails(user, event.id, { status: EventStatus.CANCELLED }),
    ).resolves.toEqual({
      ok: false,
      message: "Encontro já iniciado deve ser marcado como não realizado",
      status: 400,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("requires future events to be cancelled instead of marked as no meeting", async () => {
    await expect(
      updateEventDetails(user, event.id, { status: EventStatus.NO_MEETING }),
    ).resolves.toEqual({
      ok: false,
      message: "Encontro futuro deve ser cancelado",
      status: 400,
    });
    expect(prismaMock.event.update).not.toHaveBeenCalled();
  });

  it("reopens cancelled events as scheduled", async () => {
    prismaMock.event.findUnique.mockResolvedValue(
      eventWith({ status: EventStatus.CANCELLED }),
    );

    await updateEventDetails(user, event.id, { status: EventStatus.SCHEDULED });

    expect(prismaMock.event.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: EventStatus.SCHEDULED } }),
    );
  });
});
