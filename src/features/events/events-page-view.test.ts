import { describe, expect, it } from "vitest";
import { AttendanceStatus, EventStatus, GroupResponsibilityRole, UserRole } from "@/generated/prisma/client";
import {
  buildEventListCardState,
  buildEventsConsultationSummary,
  buildEventsConsultationView,
  buildEventsHomeSections,
  eventMeta,
  eventPeriodLabel,
  readEventConsultationMode,
  readEventPeriod,
  type EventListEvent,
} from "@/features/events/events-page-view";

const referenceDate = new Date("2026-05-08T15:00:00.000Z");

function event(overrides: Partial<EventListEvent> = {}): EventListEvent {
  return {
    id: overrides.id ?? "event-1",
    churchId: "church-1",
    title: overrides.title ?? "Célula Central",
    startsAt: overrides.startsAt ?? new Date("2026-05-08T12:00:00.000Z"),
    status: overrides.status ?? EventStatus.SCHEDULED,
    locationName: overrides.locationName ?? null,
    group: overrides.group ?? {
      id: "group-1",
      name: "Célula Central",
      churchId: "church-1",
      isActive: true,
      responsibilities: [{ userId: "leader-1", role: GroupResponsibilityRole.LEADER, activeUntil: null }],
    },
    attendances: overrides.attendances ?? [],
  };
}

describe("events-page-view", () => {
  it("normaliza modo e período de consulta", () => {
    expect(readEventConsultationMode("historico")).toBe("historico");
    expect(readEventConsultationMode("sem-presenca")).toBe("sem-presenca");
    expect(readEventConsultationMode("outro")).toBeNull();
    expect(readEventPeriod("semana-passada")).toBe("semana-passada");
    expect(readEventPeriod("30d")).toBe("30d");
    expect(readEventPeriod("outro")).toBe("semana");
  });

  it("monta metadado sem repetir o nome da célula quando o título já identifica o grupo", () => {
    const metaWithGroupTitle = eventMeta(event({ title: "Célula Central" }));
    const metaWithDifferentTitle = eventMeta(event({ title: "Encontro especial" }));

    expect(metaWithGroupTitle).not.toContain("Célula Central ·");
    expect(metaWithGroupTitle).toContain("09:00");
    expect(metaWithDifferentTitle).toMatch(/^Célula Central · .+09:00$/);
  });

  it("filtra histórico com presença registrada", () => {
    const events = [
      event({ id: "registered", status: EventStatus.COMPLETED, attendances: [{ status: AttendanceStatus.PRESENT }] }),
      event({ id: "pending" }),
    ];

    const view = buildEventsConsultationView({ mode: "historico", period: "semana", events, now: referenceDate });

    expect(view.title).toBe("Histórico de presença");
    expect(view.description).toBe("1 encontro com presença registrada");
    expect(view.filteredEvents.map((item) => item.id)).toEqual(["registered"]);
  });

  it("filtra encontros passados sem presença registrada", () => {
    const events = [
      event({ id: "past-pending", startsAt: new Date("2026-05-08T12:00:00.000Z") }),
      event({ id: "older-pending", startsAt: new Date("2026-05-06T22:00:00.000Z") }),
      event({ id: "future", startsAt: new Date("2026-05-08T18:00:00.000Z") }),
      event({ id: "cancelled", status: EventStatus.CANCELLED }),
      event({ id: "registered", status: EventStatus.COMPLETED, attendances: [{ status: AttendanceStatus.PRESENT }] }),
    ];

    const view = buildEventsConsultationView({ mode: "sem-presenca", period: "semana", events, now: referenceDate });

    expect(view.title).toBe("Encontros aguardando presença");
    expect(view.description).toBe("2 encontros aguardando registro");
    expect(view.filteredEvents.map((item) => item.id)).toEqual(["older-pending", "past-pending"]);
  });

  it("resume encontros aguardando registro e histórico dos últimos 30 dias para os atalhos", () => {
    const summary = buildEventsConsultationSummary([
      event({ id: "pending", startsAt: new Date("2026-05-06T22:00:00.000Z") }),
      event({ id: "registered", status: EventStatus.COMPLETED, attendances: [{ status: AttendanceStatus.PRESENT }] }),
      event({ id: "future", startsAt: new Date("2026-05-09T18:00:00.000Z") }),
    ], referenceDate);

    expect(summary).toEqual({
      pendingCount: 1,
      pendingDescription: "aguardando registro",
      historyCount: 1,
      historyDescription: "registrados",
    });
  });

  it("mantém uma leitura tranquila quando não há encontros aguardando registro nem histórico", () => {
    const summary = buildEventsConsultationSummary([
      event({ id: "future", startsAt: new Date("2026-05-09T18:00:00.000Z") }),
    ], referenceDate);

    expect(summary).toMatchObject({
      pendingCount: 0,
      pendingDescription: "tudo em dia",
      historyCount: 0,
      historyDescription: "sem histórico",
    });
  });

  it("separa encontros de hoje dos próximos encontros da semana", () => {
    const events = [
      event({ id: "today", startsAt: new Date("2026-05-08T18:00:00.000Z") }),
      event({ id: "week", startsAt: new Date("2026-05-09T18:00:00.000Z") }),
      event({ id: "registered", startsAt: new Date("2026-05-09T19:00:00.000Z"), status: EventStatus.COMPLETED, attendances: [{ status: AttendanceStatus.PRESENT }] }),
    ];

    const sections = buildEventsHomeSections(events, referenceDate);

    expect(sections.todayEvents.map((item) => item.id)).toEqual(["today"]);
    expect(sections.weekEvents.map((item) => item.id)).toEqual(["week"]);
  });

  it("descreve o card de presença aguardando registro para líder da célula", () => {
    const state = buildEventListCardState(
      event(),
      { id: "leader-1", churchId: "church-1", role: UserRole.LEADER },
      referenceDate,
    );

    expect(state.label).toBe("Aguardando presença");
    expect(state.actionLabel).toBe("Registrar presença");
    expect(state.badgeTone).toBe("warn");
    expect(state.pendingAgeLabel).toBe("hoje");
  });

  it("informa há quantos dias um encontro aguarda registro", () => {
    const state = buildEventListCardState(
      event({ startsAt: new Date("2026-05-06T22:00:00.000Z") }),
      { id: "leader-1", churchId: "church-1", role: UserRole.LEADER },
      referenceDate,
    );

    expect(state.pendingAgeLabel).toBe("há 2 dias");
  });

  it("mantém labels de período oficiais", () => {
    expect(eventPeriodLabel("semana")).toBe("Esta semana");
    expect(eventPeriodLabel("semana-passada")).toBe("Semana passada");
    expect(eventPeriodLabel("30d")).toBe("Últimos 30 dias");
  });
});
