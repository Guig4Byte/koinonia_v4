import { EventStatus, EventType, GroupKind } from "../../generated/prisma/client";
import { getVisibleGroupWhere, type PermissionUser } from "../permissions/permissions";
import { prisma } from "../../lib/prisma";

export const DEFAULT_CELL_MEETING_GENERATION_WEEKS = 12;

export type CellMeetingSchedule = {
  meetingDayOfWeek: number | null;
  meetingTime: string | null;
};

export type EnsureUpcomingCellMeetingsOptions = {
  referenceDate?: Date;
  weeksAhead?: number;
  groupIds?: string[];
};

export type EnsureUpcomingCellMeetingsResult = {
  groupsChecked: number;
  eventsCreated: number;
  generatedUntil: Date;
};

function startOfLocalDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function parseMeetingTime(meetingTime: string | null) {
  if (!meetingTime) return null;

  const match = /^(\d{1,2}):(\d{2})$/.exec(meetingTime.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

function isValidWeekday(value: number | null): value is number {
  return Number.isInteger(value) && value !== null && value >= 0 && value <= 6;
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

  const first = startOfLocalDay(from);
  const daysUntilMeeting = (meetingDayOfWeek - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + daysUntilMeeting);
  first.setHours(time.hours, time.minutes, 0, 0);

  if (first < from) {
    first.setDate(first.getDate() + 7);
  }

  const starts: Date[] = [];
  const cursor = new Date(first);

  while (cursor <= until) {
    starts.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  return starts;
}

export async function ensureUpcomingCellMeetingsForUser(
  user: PermissionUser,
  options: EnsureUpcomingCellMeetingsOptions = {},
): Promise<EnsureUpcomingCellMeetingsResult> {
  const referenceDate = options.referenceDate ?? new Date();
  const generationStart = startOfLocalDay(referenceDate);
  const weeksAhead = options.weeksAhead ?? DEFAULT_CELL_MEETING_GENERATION_WEEKS;
  const generatedUntil = addDays(generationStart, weeksAhead * 7);

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
        },
      ],
    },
    select: {
      id: true,
      churchId: true,
      name: true,
      leaderUserId: true,
      meetingDayOfWeek: true,
      meetingTime: true,
      locationName: true,
      eventsGeneratedUntil: true,
    },
  });

  let eventsCreated = 0;

  for (const group of groups) {
    const starts = scheduledCellMeetingStarts({
      meetingDayOfWeek: group.meetingDayOfWeek,
      meetingTime: group.meetingTime,
      from: generationStart,
      until: generatedUntil,
    });

    if (starts.length === 0) continue;

    const existingEvents = await prisma.event.findMany({
      where: {
        groupId: group.id,
        type: EventType.CELL_MEETING,
        OR: [
          { startsAt: { gte: generationStart, lte: generatedUntil } },
          { scheduleStartsAt: { gte: generationStart, lte: generatedUntil } },
        ],
      },
      select: { startsAt: true, scheduleStartsAt: true },
    });

    const existingStarts = new Set(existingEvents.map((event) => (event.scheduleStartsAt ?? event.startsAt).getTime()));
    const startsToCreate = starts.filter((startsAt) => !existingStarts.has(startsAt.getTime()));

    if (startsToCreate.length > 0) {
      const result = await prisma.event.createMany({
        data: startsToCreate.map((startsAt) => ({
          churchId: group.churchId,
          groupId: group.id,
          createdById: group.leaderUserId,
          type: EventType.CELL_MEETING,
          title: group.name,
          startsAt,
          status: EventStatus.SCHEDULED,
          locationName: group.locationName,
          generatedFromSchedule: true,
          scheduleStartsAt: startsAt,
        })),
        skipDuplicates: true,
      });

      eventsCreated += result.count;
    }

    if (!group.eventsGeneratedUntil || group.eventsGeneratedUntil < generatedUntil) {
      await prisma.smallGroup.update({
        where: { id: group.id },
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
