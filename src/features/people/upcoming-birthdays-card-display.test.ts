import { describe, expect, it } from "vitest";
import { buildUpcomingBirthdaysCardDisplay } from "@/features/people/upcoming-birthdays-card-display";
import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";

function birthday(
  overrides: Partial<UpcomingBirthdayItem> & { personId: string; fullName: string },
): UpcomingBirthdayItem {
  return {
    dateLabel: "10 mai",
    daysUntil: 1,
    relativeLabel: "Amanhã",
    ...overrides,
  };
}

describe("buildUpcomingBirthdaysCardDisplay", () => {
  it("limita a lista simples aos primeiros quatro aniversários", () => {
    const display = buildUpcomingBirthdaysCardDisplay([
      birthday({ personId: "1", fullName: "Ana" }),
      birthday({ personId: "2", fullName: "Bruno" }),
      birthday({ personId: "3", fullName: "Camila" }),
      birthday({ personId: "4", fullName: "Daniel" }),
      birthday({ personId: "5", fullName: "Ester" }),
    ]);

    expect(display.visibleBirthdays.map((item) => item.personId)).toEqual(["1", "2", "3", "4"]);
    expect(display.hiddenCount).toBe(1);
    expect(display.groupedBirthdays).toEqual([]);
  });

  it("respeita limite visível informado pelo card", () => {
    const display = buildUpcomingBirthdaysCardDisplay(
      [
        birthday({ personId: "1", fullName: "Ana" }),
        birthday({ personId: "2", fullName: "Bruno" }),
        birthday({ personId: "3", fullName: "Camila" }),
      ],
      { visibleLimit: 2 },
    );

    expect(display.visibleBirthdays.map((item) => item.personId)).toEqual(["1", "2"]);
    expect(display.hiddenCount).toBe(1);
  });

  it("agrupa aniversários visíveis por célula preservando a ordem de aparição", () => {
    const display = buildUpcomingBirthdaysCardDisplay(
      [
        birthday({ personId: "1", fullName: "Ana", groupName: "Célula Semear" }),
        birthday({ personId: "2", fullName: "Bruno", groupName: "Célula Vida" }),
        birthday({ personId: "3", fullName: "Camila", groupName: "Célula Semear" }),
        birthday({ personId: "4", fullName: "Daniel", groupName: null }),
        birthday({ personId: "5", fullName: "Ester", groupName: "Célula Vida" }),
        birthday({ personId: "6", fullName: "Felipe", groupName: "Célula Extra" }),
      ],
      { variant: "grouped" },
    );

    expect(display.visibleBirthdays.map((item) => item.personId)).toEqual(["1", "2", "3", "4", "5"]);
    expect(display.hiddenCount).toBe(1);
    expect(display.groupedBirthdays).toEqual([
      {
        groupName: "Célula Semear",
        birthdays: [
          birthday({ personId: "1", fullName: "Ana", groupName: "Célula Semear" }),
          birthday({ personId: "3", fullName: "Camila", groupName: "Célula Semear" }),
        ],
      },
      {
        groupName: "Célula Vida",
        birthdays: [
          birthday({ personId: "2", fullName: "Bruno", groupName: "Célula Vida" }),
          birthday({ personId: "5", fullName: "Ester", groupName: "Célula Vida" }),
        ],
      },
      {
        groupName: "Sem célula informada",
        birthdays: [birthday({ personId: "4", fullName: "Daniel", groupName: null })],
      },
    ]);
  });
});
