import { describe, expect, it } from "vitest";
import { buildUpcomingBirthdays } from "@/features/people/upcoming-birthdays";

describe("buildUpcomingBirthdays", () => {
  it("lista aniversários dos próximos 30 dias ordenados pela data", () => {
    const referenceDate = new Date("2026-05-10T12:00:00.000Z");

    expect(buildUpcomingBirthdays([
      { id: "2", fullName: "Carlos", birthDate: new Date("1990-05-20T00:00:00.000Z"), groupName: "Célula Semear" },
      { id: "1", fullName: "Beatriz", birthDate: new Date("1992-05-11T00:00:00.000Z"), groupName: "Célula Semear" },
      { id: "3", fullName: "Daniel", birthDate: new Date("1988-06-20T00:00:00.000Z"), groupName: "Célula Semear" },
    ], { referenceDate })).toEqual([
      {
        personId: "1",
        fullName: "Beatriz",
        groupName: "Célula Semear",
        dateLabel: "11 mai",
        relativeLabel: "Amanhã",
        daysUntil: 1,
      },
      {
        personId: "2",
        fullName: "Carlos",
        groupName: "Célula Semear",
        dateLabel: "20 mai",
        relativeLabel: "Em 10 dias",
        daysUntil: 10,
      },
    ]);
  });

  it("considera a virada do ano", () => {
    const referenceDate = new Date("2026-12-20T12:00:00.000Z");

    expect(buildUpcomingBirthdays([
      { id: "1", fullName: "Ana", birthDate: new Date("1995-01-05T00:00:00.000Z") },
      { id: "2", fullName: "Bruno", birthDate: new Date("1995-02-10T00:00:00.000Z") },
    ], { referenceDate })).toEqual([
      {
        personId: "1",
        fullName: "Ana",
        groupName: undefined,
        dateLabel: "05 jan",
        relativeLabel: "Em 16 dias",
        daysUntil: 16,
      },
    ]);
  });

  it("não duplica a mesma pessoa quando ela aparece em mais de uma célula visível", () => {
    const referenceDate = new Date("2026-05-10T12:00:00.000Z");

    expect(buildUpcomingBirthdays([
      { id: "1", fullName: "Beatriz", birthDate: new Date("1992-05-11T00:00:00.000Z"), groupName: "Célula A" },
      { id: "1", fullName: "Beatriz", birthDate: new Date("1992-05-11T00:00:00.000Z"), groupName: "Célula B" },
    ], { referenceDate })).toHaveLength(1);
  });
});
