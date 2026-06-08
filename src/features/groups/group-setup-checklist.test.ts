import { describe, expect, it } from "vitest";
import { GroupResponsibilityRole } from "@/generated/prisma/client";
import {
  buildGroupSetupChecklist,
  shouldShowGroupSetupChecklistAction,
  type GroupSetupChecklistGroup,
} from "./group-setup-checklist";

function group(overrides: Partial<GroupSetupChecklistGroup> = {}): GroupSetupChecklistGroup {
  return {
    id: "group-1",
    name: "Célula Semear",
    responsibilities: [
      { role: GroupResponsibilityRole.LEADER },
      { role: GroupResponsibilityRole.SUPERVISOR },
    ],
    memberships: [{ id: "membership-1" }, { id: "membership-2" }],
    meetingDayOfWeek: 3,
    meetingTime: "20:00",
    recordedEventsCount: 0,
    ...overrides,
  };
}

describe("group-setup-checklist", () => {
  it("resume a prontidão operacional da célula", () => {
    const checklist = buildGroupSetupChecklist({ group: group(), currentEventId: "event-1" });

    expect(checklist).toMatchObject({
      groupName: "Célula Semear",
      action: { href: "/eventos/event-1", label: "Registrar primeiro encontro" },
    });
    expect(checklist.items.map((item) => [item.key, item.complete])).toEqual([
      ["leaders", true],
      ["supervisors", true],
      ["members", true],
      ["schedule", true],
      ["firstMeeting", false],
    ]);
  });

  it("aponta pendências de implantação sem tratar como alerta pastoral", () => {
    const checklist = buildGroupSetupChecklist({
      group: group({ responsibilities: [], memberships: [], meetingDayOfWeek: null, meetingTime: null }),
      canEditGroup: true,
    });

    expect(checklist.items).toEqual([
      { key: "leaders", label: "Líderes definidos", complete: false },
      { key: "supervisors", label: "Supervisores definidos", complete: false },
      { key: "members", label: "0 membros cadastrados", complete: false },
      { key: "schedule", label: "Dia e horário definidos", complete: false },
      { key: "firstMeeting", label: "Primeiro encontro ainda não registrado", complete: false },
    ]);
    expect(checklist.action).toEqual({ href: "/celulas/group-1/editar", label: "Definir dia e horário" });
  });

  it("prioriza ajuste de agenda incompleta para quem pode editar", () => {
    const checklist = buildGroupSetupChecklist({
      group: group({ meetingDayOfWeek: null, meetingTime: null }),
      currentEventId: "event-1",
      canEditGroup: true,
    });

    expect(checklist.action).toEqual({ href: "/celulas/group-1/editar", label: "Definir dia e horário" });
  });

  it("esconde a ação quando outro card já leva para o mesmo destino", () => {
    const checklist = buildGroupSetupChecklist({ group: group(), currentEventId: "event-1" });

    expect(shouldShowGroupSetupChecklistAction(checklist, ["/celulas/group-1"])).toBe(true);
    expect(shouldShowGroupSetupChecklistAction(checklist, ["/eventos/event-1"])).toBe(false);
    expect(shouldShowGroupSetupChecklistAction(checklist, [null, undefined])).toBe(true);
  });
});
