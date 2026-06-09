import { describe, expect, it } from "vitest";
import { EventStatus, EventType } from "@/generated/prisma/client";
import { presenceHistoryEventWhere } from "./presence-query";

describe("presence-query", () => {
  it("busca somente encontros de célula já ocorridos com presença registrada", () => {
    const now = new Date("2026-05-08T12:00:00.000Z");

    expect(presenceHistoryEventWhere(now)).toEqual({
      type: EventType.CELL_MEETING,
      startsAt: { lte: now },
      OR: [
        { status: EventStatus.COMPLETED },
        { attendances: { some: {} } },
      ],
    });
  });
});
