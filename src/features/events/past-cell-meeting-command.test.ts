import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EventStatus, EventType, GroupKind, GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import type { PermissionUser } from "@/features/permissions/permissions";
import {
  createPastCellMeeting,
  pastCellMeetingPayloadSchema,
  type PastCellMeetingPayload,
} from "./past-cell-meeting-command";

const prismaMock = vi.hoisted(() => ({
  smallGroup: {
    findFirst: vi.fn(),
  },
  event: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

const user: PermissionUser = {
  id: "22222222-2222-4222-8222-222222222222",
  churchId: "33333333-3333-4333-8333-333333333333",
  role: UserRole.LEADER,
};

const group = {
  id: "11111111-1111-4111-8111-111111111111",
  churchId: user.churchId,
  name: "Célula Central",
  kind: GroupKind.CELL,
  isActive: true,
  locationName: "Casa da Ana",
  responsibilities: [
    {
      userId: user.id,
      role: GroupResponsibilityRole.LEADER,
      activeUntil: null,
    },
  ],
};

const validPayload: PastCellMeetingPayload = {
  groupId: group.id,
  date: "30/05/2026",
  time: "17:30",
};

function groupWith(overrides: Partial<typeof group> = {}) {
  return { ...group, ...overrides };
}

describe("past cell meeting command", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-30T21:00:00.000Z"));
    vi.clearAllMocks();

    prismaMock.smallGroup.findFirst.mockResolvedValue(group);
    prismaMock.event.findFirst.mockResolvedValue(null);
    prismaMock.event.create.mockResolvedValue({ id: "event-1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("validates the required payload fields", () => {
    expect(pastCellMeetingPayloadSchema.safeParse(validPayload).success).toBe(true);
    expect(pastCellMeetingPayloadSchema.safeParse({ ...validPayload, groupId: "group-1" }).success).toBe(false);
    expect(pastCellMeetingPayloadSchema.safeParse({ ...validPayload, date: "" }).success).toBe(false);
  });

  it("creates a pending manual cell meeting using the group default location", async () => {
    await expect(createPastCellMeeting(user, validPayload)).resolves.toEqual({
      ok: true,
      data: { event: { id: "event-1" } },
    });

    const startsAt = new Date("2026-05-30T20:30:00.000Z");

    expect(prismaMock.event.findFirst).toHaveBeenCalledWith({
      where: {
        groupId: group.id,
        type: EventType.CELL_MEETING,
        OR: [
          { startsAt },
          { scheduleStartsAt: startsAt },
        ],
      },
      select: { id: true },
    });
    expect(prismaMock.event.create).toHaveBeenCalledWith({
      data: {
        churchId: user.churchId,
        groupId: group.id,
        createdById: user.id,
        type: EventType.CELL_MEETING,
        title: group.name,
        startsAt,
        status: EventStatus.SCHEDULED,
        locationName: group.locationName,
        generatedFromSchedule: false,
        scheduleStartsAt: startsAt,
      },
      select: { id: true },
    });
  });

  it("uses an informed location when the meeting happened outside the default place", async () => {
    await createPastCellMeeting(user, {
      ...validPayload,
      locationName: "  Salão principal  ",
    });

    expect(prismaMock.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ locationName: "Salão principal" }),
      }),
    );
  });

  it("rejects future date and time without querying the group", async () => {
    await expect(
      createPastCellMeeting(user, { ...validPayload, time: "18:30" }),
    ).resolves.toEqual({
      ok: false,
      message: "Use uma data e horário que já passaram para registrar encontro anterior.",
      status: 400,
    });

    expect(prismaMock.smallGroup.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it("returns 404 without writing when the cell is not available to the user church", async () => {
    prismaMock.smallGroup.findFirst.mockResolvedValue(null);

    await expect(createPastCellMeeting(user, validPayload)).resolves.toEqual({
      ok: false,
      message: "Célula não encontrada",
      status: 404,
    });
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it("allows only the active cell leadership to create a past meeting", async () => {
    prismaMock.smallGroup.findFirst.mockResolvedValue(groupWith({ responsibilities: [] }));

    await expect(createPastCellMeeting(user, validPayload)).resolves.toEqual({
      ok: false,
      message: "Somente a liderança da célula pode registrar encontro anterior.",
      status: 403,
    });
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it("rejects duplicates by actual or original scheduled start", async () => {
    prismaMock.event.findFirst.mockResolvedValue({ id: "event-2" });

    await expect(createPastCellMeeting(user, validPayload)).resolves.toEqual({
      ok: false,
      message: "Já existe um encontro desta célula nesse dia e horário. Revise o encontro existente antes de criar outro.",
      status: 409,
    });
    expect(prismaMock.event.create).not.toHaveBeenCalled();
  });

  it("returns conflict when the database catches a concurrent duplicate", async () => {
    prismaMock.event.create.mockRejectedValue({ code: "P2002" });

    await expect(createPastCellMeeting(user, validPayload)).resolves.toEqual({
      ok: false,
      message: "Já existe um encontro desta célula nesse dia e horário. Revise o encontro existente antes de criar outro.",
      status: 409,
    });
  });
});
