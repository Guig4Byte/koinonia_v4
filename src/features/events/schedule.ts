import { EventStatus, EventType, GroupKind, GroupResponsibilityRole } from "@/generated/prisma/client";
import { activeGroupResponsibilityUserSelect } from "@/lib/domain/group-responsibility-query";
import { DAYS_PER_WEEK, isValidWeekday } from "@/lib/domain/weekdays";
import { getVisibleGroupWhere, type PermissionUser } from "@/features/permissions/permissions";
import { addBrasiliaDays, dateFromBrasiliaParts, getBrasiliaDateParts, startOfBrasiliaDay } from "@/lib/brasilia-time";
import { prisma } from "@/lib/prisma";
import { parseClockTime } from "@/lib/clock-time";

export const DEFAULT_CELL_MEETING_GENERATION_WEEKS = 12;

export type CellMeetingSchedule = {
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
};

export type EnsureUpcomingCellMeetingsOptions = {
  referenceDate?: Date;
  weeksAhead?: number;
  groupIds?: string[];
  force?: boolean;
};

export type EnsureUpcomingCellMeetingsResult = {
  groupsChecked: number;
  eventsCreated: number;
  generatedUntil: Date;
};

export type ScheduledCellMeetingGroup = CellMeetingSchedule & {
  id: string;
  churchId: string;
  name: string;
  responsibilities: { userId: string }[];
  locationName: string | null;
  eventsGeneratedUntil: Date | null;
};

export type ExistingCellMeeting = {
  groupId: string | null;
  startsAt: Date;
  scheduleStartsAt: Date | null;
};

export type ScheduledCellMeetingPlan = {
  group: ScheduledCellMeetingGroup;
  starts: Date[];
};

export type ScheduledCellMeetingCreateData = {
  churchId: string;
  groupId: string;
  createdById: string | null;
  type: typeof EventType.CELL_MEETING;
  title: string;
  startsAt: Date;
  status: typeof EventStatus.SCHEDULED;
  locationName: string | null;
  generatedFromSchedule: true;
  scheduleStartsAt: Date;
};

export function parseMeetingTime(meetingTime: string | null) {
  return meetingTime ? parseClockTime(meetingTime, { allowSingleDigitHour: true }) : null;
}

export function scheduledCellMeetingStarts({
  meetingDayOfWeek,
  meetingTime,
  from,
  until,
}: CellMeetingSchedule & { from: Date; until: Date }) {
  const time = parseMeetingTime(meetingTime);
  if (!isValidWeekday(meetingDayOfWeek) || !time) return [];
  if (until < from) return [];

  const firstDay = startOfBrasiliaDay(from);
  const firstDayParts = getBrasiliaDateParts(firstDay);
  const daysUntilMeeting = (meetingDayOfWeek - firstDayParts.weekday + DAYS_PER_WEEK) % DAYS_PER_WEEK;
  const firstMeetingDayParts = getBrasiliaDateParts(addBrasiliaDays(firstDay, daysUntilMeeting));
  let first = dateFromBrasiliaParts(
    firstMeetingDayParts.year,
    firstMeetingDayParts.month,
    firstMeetingDayParts.day,
    time.hours,
    time.minutes,
  );

  if (first < from) {
    first = addBrasiliaDays(first, DAYS_PER_WEEK);
  }

  const starts: Date[] = [];
  let cursor = new Date(first);

  while (cursor <= until) {
    starts.push(new Date(cursor));
    cursor = addBrasiliaDays(cursor, DAYS_PER_WEEK);
  }

  return starts;
}

export function scheduledCellMeetingPlans(
  groups: ScheduledCellMeetingGroup[],
  { from, until }: { from: Date; until: Date },
): ScheduledCellMeetingPlan[] {
  return groups.flatMap((group) => {
    const starts = scheduledCellMeetingStarts({
      meetingDayOfWeek: group.meetingDayOfWeek,
      meetingTime: group.meetingTime,
      from,
      until,
    });

    return starts.length > 0 ? [{ group, starts }] : [];
  });
}

export function existingCellMeetingStartsByGroup(existingEvents: ExistingCellMeeting[]) {
  const existingStartsByGroup = new Map<string, Set<number>>();

  for (const event of existingEvents) {
    if (!event.groupId) continue;

    const groupExistingStarts = existingStartsByGroup.get(event.groupId) ?? new Set<number>();
    groupExistingStarts.add((event.scheduleStartsAt ?? event.startsAt).getTime());
    existingStartsByGroup.set(event.groupId, groupExistingStarts);
  }

  return existingStartsByGroup;
}

export function scheduledCellMeetingCreateData(
  plans: ScheduledCellMeetingPlan[],
  existingStartsByGroup: Map<string, Set<number>>,
): ScheduledCellMeetingCreateData[] {
  return plans.flatMap(({ group, starts }) => {
    const existingStarts = existingStartsByGroup.get(group.id) ?? new Set<number>();
    const startsToCreate = starts.filter((startsAt) => !existingStarts.has(startsAt.getTime()));

    return startsToCreate.map((startsAt) => ({
      churchId: group.churchId,
      groupId: group.id,
      createdById: group.responsibilities[0]?.userId ?? null,
      type: EventType.CELL_MEETING,
      title: group.name,
      startsAt,
      status: EventStatus.SCHEDULED,
      locationName: group.locationName,
      generatedFromSchedule: true,
      scheduleStartsAt: startsAt,
    }));
  });
}

export async function ensureUpcomingCellMeetingsForUser(
  user: PermissionUser,
  options: EnsureUpcomingCellMeetingsOptions = {},
): Promise<EnsureUpcomingCellMeetingsResult> {
  const referenceDate = options.referenceDate ?? new Date();
  const generationStart = startOfBrasiliaDay(referenceDate);
  const weeksAhead = options.weeksAhead ?? DEFAULT_CELL_MEETING_GENERATION_WEEKS;
  const generatedUntil = addBrasiliaDays(generationStart, weeksAhead * DAYS_PER_WEEK);
  const shouldForceGeneration = options.force ?? false;

  const groups = await prisma.smallGroup.findMany({
    where: {
      AND: [
        getVisibleGroupWhere(user),
        {
          kind: GroupKind.CELL,
          isActive: true,
          meetingDayOfWeek: { not: null },
          meetingTime: { not: null },
          ...(options.groupIds && options.groupIds.length > 0 ? { id: { in: options.groupIds } } : {}),
          ...(shouldForceGeneration
            ? {}
            : {
                OR: [
                  { eventsGeneratedUntil: null },
                  { eventsGeneratedUntil: { lt: generatedUntil } },
                ],
              }),
        },
      ],
    },
    select: {
      id: true,
      churchId: true,
      name: true,
      responsibilities: activeGroupResponsibilityUserSelect(GroupResponsibilityRole.LEADER),
      meetingDayOfWeek: true,
      meetingTime: true,
      locationName: true,
      eventsGeneratedUntil: true,
    },
  });

  const plans = scheduledCellMeetingPlans(groups, {
    from: generationStart,
    until: generatedUntil,
  });

  let eventsCreated = 0;

  if (plans.length > 0) {
    const groupIds = plans.map(({ group }) => group.id);
    const existingEvents = await prisma.event.findMany({
      where: {
        groupId: { in: groupIds },
        type: EventType.CELL_MEETING,
        OR: [
          { startsAt: { gte: generationStart, lte: generatedUntil } },
          { scheduleStartsAt: { gte: generationStart, lte: generatedUntil } },
        ],
      },
      select: { groupId: true, startsAt: true, scheduleStartsAt: true },
    });

    const createData = scheduledCellMeetingCreateData(plans, existingCellMeetingStartsByGroup(existingEvents));

    if (createData.length > 0) {
      const result = await prisma.event.createMany({
        data: createData,
        skipDuplicates: true,
      });

      eventsCreated = result.count;
    }

    const groupIdsToUpdate = plans
      .filter(({ group }) => !group.eventsGeneratedUntil || group.eventsGeneratedUntil < generatedUntil)
      .map(({ group }) => group.id);

    if (groupIdsToUpdate.length > 0) {
      await prisma.smallGroup.updateMany({
        where: { id: { in: groupIdsToUpdate } },
        data: { eventsGeneratedUntil: generatedUntil },
      });
    }
  }

  return {
    groupsChecked: groups.length,
    eventsCreated,
    generatedUntil,
  };
}
