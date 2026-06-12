import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";

export const UPCOMING_BIRTHDAYS_VISIBLE_LIMIT = 4;
export const GROUPED_UPCOMING_BIRTHDAYS_VISIBLE_LIMIT = 5;

export type UpcomingBirthdaysCardVariant = "list" | "grouped";

export type GroupedUpcomingBirthdays = {
  groupName: string;
  birthdays: UpcomingBirthdayItem[];
};

export type UpcomingBirthdaysCardDisplay = {
  visibleBirthdays: UpcomingBirthdayItem[];
  hiddenCount: number;
  groupedBirthdays: GroupedUpcomingBirthdays[];
};

function groupVisibleBirthdaysByCell(
  birthdays: UpcomingBirthdayItem[],
): GroupedUpcomingBirthdays[] {
  const groups = new Map<string, UpcomingBirthdayItem[]>();

  birthdays.forEach((birthday) => {
    const groupName = birthday.groupName || "Sem célula informada";
    const currentBirthdays = groups.get(groupName) ?? [];

    currentBirthdays.push(birthday);
    groups.set(groupName, currentBirthdays);
  });

  return Array.from(groups.entries()).map(([groupName, groupBirthdays]) => ({
    groupName,
    birthdays: groupBirthdays,
  }));
}

function upcomingBirthdaysVisibleLimitForVariant(variant: UpcomingBirthdaysCardVariant) {
  return variant === "grouped"
    ? GROUPED_UPCOMING_BIRTHDAYS_VISIBLE_LIMIT
    : UPCOMING_BIRTHDAYS_VISIBLE_LIMIT;
}

export function buildUpcomingBirthdaysCardDisplay(
  birthdays: UpcomingBirthdayItem[],
  {
    variant = "list",
    visibleLimit,
  }: {
    variant?: UpcomingBirthdaysCardVariant;
    visibleLimit?: number;
  } = {},
): UpcomingBirthdaysCardDisplay {
  const resolvedVisibleLimit = visibleLimit
    ?? upcomingBirthdaysVisibleLimitForVariant(variant);
  const visibleBirthdays = birthdays.slice(0, resolvedVisibleLimit);

  return {
    visibleBirthdays,
    hiddenCount: birthdays.length - visibleBirthdays.length,
    groupedBirthdays: variant === "grouped"
      ? groupVisibleBirthdaysByCell(visibleBirthdays)
      : [],
  };
}
