import { hash } from "bcryptjs";
import {
  AttendanceStatus,
  CareKind,
  EventStatus,
  MembershipRole,
  PersonStatus,
  SignalSeverity,
  SignalSource,
  SignalStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { createSeedCareTouch } from "./seed-helpers/care";
import { clearDatabase } from "./seed-helpers/cleanup";
import {
  createSeedAttendanceRecords,
  createSeedEvent,
} from "./seed-helpers/events";
import {
  createSeedGroupMemberships,
  createSeedGroupWithResponsibilities,
} from "./seed-helpers/groups";
import type { SeedMember, SeedUser } from "./seed-helpers/types";
import { createSeedUserWithPerson } from "./seed-helpers/users";
import {
  addBrasiliaDays,
  dateFromBrasiliaParts,
  getBrasiliaDateParts,
  startOfBrasiliaWeek,
} from "../src/lib/brasilia-time";

const DEFAULT_GROUPS = 50;
const DEFAULT_MEMBERS_PER_GROUP = 12;
const DEFAULT_COMPLETED_WEEKS = 12;
const DEFAULT_FUTURE_WEEKS = 4;
const DEFAULT_SUPERVISORS = 5;
const PASSWORD = "koinonia123";

type PerformanceSeedConfig = {
  groups: number;
  membersPerGroup: number;
  completedWeeks: number;
  futureWeeks: number;
  supervisors: number;
};

type PerformanceGroup = {
  id: string;
  name: string;
  index: number;
  leader: SeedUser;
  supervisor: SeedUser;
  members: SeedMember[];
};

function readPositiveInt(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readConfig(): PerformanceSeedConfig {
  const groups = readPositiveInt("PERF_SEED_GROUPS", DEFAULT_GROUPS);
  const membersPerGroup = readPositiveInt(
    "PERF_SEED_MEMBERS_PER_GROUP",
    DEFAULT_MEMBERS_PER_GROUP,
  );
  const completedWeeks = readPositiveInt(
    "PERF_SEED_COMPLETED_WEEKS",
    DEFAULT_COMPLETED_WEEKS,
  );
  const futureWeeks = readPositiveInt(
    "PERF_SEED_FUTURE_WEEKS",
    DEFAULT_FUTURE_WEEKS,
  );
  const supervisors = Math.min(
    groups,
    readPositiveInt("PERF_SEED_SUPERVISORS", DEFAULT_SUPERVISORS),
  );

  return {
    groups,
    membersPerGroup,
    completedWeeks,
    futureWeeks,
    supervisors,
  };
}

function addDays(days: number, hour = 20): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function addWeeks(weeks: number, hour = 20): Date {
  return addDays(weeks * 7, hour);
}

function groupMeetingDay(index: number): number {
  return (index % 6) + 1;
}

function groupMeetingTime(index: number): string {
  const slots = ["19:00", "19:30", "20:00", "20:30"] as const;
  return slots[index % slots.length];
}

function parseSeedMeetingTime(meetingTime: string) {
  const [hours = "20", minutes = "0"] = meetingTime.split(":");

  return {
    hours: Number.parseInt(hours, 10),
    minutes: Number.parseInt(minutes, 10),
  };
}

function groupMeetingStartsAt(groupIndex: number, weekOffset: number): Date {
  const weekStart = startOfBrasiliaWeek(new Date(), 1);
  const meetingDate = addBrasiliaDays(
    weekStart,
    weekOffset * 7 + groupMeetingDay(groupIndex) - 1,
  );
  const parts = getBrasiliaDateParts(meetingDate);
  const time = parseSeedMeetingTime(groupMeetingTime(groupIndex));

  return dateFromBrasiliaParts(
    parts.year,
    parts.month,
    parts.day,
    time.hours,
    time.minutes,
  );
}

function attendanceStatusFor({
  groupIndex,
  memberIndex,
  weekIndex,
}: {
  groupIndex: number;
  memberIndex: number;
  weekIndex: number;
}): AttendanceStatus {
  if (memberIndex % 17 === 0 && weekIndex >= 9) {
    return AttendanceStatus.ABSENT;
  }

  if ((groupIndex + memberIndex + weekIndex) % 13 === 0) {
    return AttendanceStatus.JUSTIFIED;
  }

  if ((groupIndex * 3 + memberIndex + weekIndex) % 11 === 0) {
    return AttendanceStatus.ABSENT;
  }

  return AttendanceStatus.PRESENT;
}

async function createUser({
  churchId,
  name,
  email,
  role,
  passwordHash,
}: {
  churchId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
}): Promise<SeedUser> {
  return createSeedUserWithPerson({
    prisma,
    churchId,
    name,
    email,
    role,
    passwordHash,
    phone: null,
  });
}

async function createMembers({
  churchId,
  groupIndex,
  membersPerGroup,
}: {
  churchId: string;
  groupIndex: number;
  membersPerGroup: number;
}): Promise<SeedMember[]> {
  const members: SeedMember[] = [];

  for (let memberIndex = 0; memberIndex < membersPerGroup; memberIndex += 1) {
    const person = await prisma.person.create({
      data: {
        churchId,
        fullName: `Membro ${String(groupIndex + 1).padStart(2, "0")}-${String(
          memberIndex + 1,
        ).padStart(2, "0")}`,
        phone: `+558197${String(groupIndex + 1).padStart(3, "0")}${String(
          memberIndex + 1,
        ).padStart(3, "0")}`,
        status:
          memberIndex % 17 === 0
            ? PersonStatus.NEEDS_ATTENTION
            : PersonStatus.ACTIVE,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    members.push(person);
  }

  return members;
}

async function createPerformanceGroup({
  churchId,
  groupIndex,
  leader,
  supervisor,
  membersPerGroup,
  generatedUntil,
}: {
  churchId: string;
  groupIndex: number;
  leader: SeedUser;
  supervisor: SeedUser;
  membersPerGroup: number;
  generatedUntil: Date;
}): Promise<PerformanceGroup> {
  const groupName = `Célula Performance ${String(groupIndex + 1).padStart(2, "0")}`;

  const group = await createSeedGroupWithResponsibilities({
    prisma,
    churchId,
    name: groupName,
    leader,
    supervisor,
    meetingDayOfWeek: groupMeetingDay(groupIndex),
    meetingTime: groupMeetingTime(groupIndex),
    locationName: `Casa Performance ${String(groupIndex + 1).padStart(2, "0")}`,
    eventsGeneratedUntil: generatedUntil,
  });

  const members = await createMembers({
    churchId,
    groupIndex,
    membersPerGroup,
  });

  await createSeedGroupMemberships({
    prisma,
    groupId: group.id,
    members,
    role: MembershipRole.MEMBER,
  });

  return {
    id: group.id,
    name: group.name,
    index: groupIndex,
    leader,
    supervisor,
    members,
  };
}

async function createCompletedMeetings({
  churchId,
  group,
  completedWeeks,
}: {
  churchId: string;
  group: PerformanceGroup;
  completedWeeks: number;
}) {
  for (let weekIndex = 0; weekIndex < completedWeeks; weekIndex += 1) {
    const startsAt = groupMeetingStartsAt(
      group.index,
      -(completedWeeks - weekIndex),
    );

    const event = await createSeedEvent({
      prisma,
      churchId,
      groupId: group.id,
      createdById: group.leader.id,
      title: group.name,
      startsAt,
      status: EventStatus.COMPLETED,
      locationName: `Casa Performance ${String(group.index + 1).padStart(2, "0")}`,
      scheduleStartsAt: startsAt,
    });

    await createSeedAttendanceRecords({
      prisma,
      eventId: event.id,
      records: group.members.map((member, memberIndex) => ({
        personId: member.id,
        status: attendanceStatusFor({
          groupIndex: group.index,
          memberIndex,
          weekIndex,
        }),
      })),
    });
  }
}

async function createFutureMeetings({
  churchId,
  group,
  futureWeeks,
}: {
  churchId: string;
  group: PerformanceGroup;
  futureWeeks: number;
}) {
  for (let weekIndex = 0; weekIndex < futureWeeks; weekIndex += 1) {
    const startsAt = groupMeetingStartsAt(group.index, weekIndex);

    await createSeedEvent({
      prisma,
      churchId,
      groupId: group.id,
      createdById: group.leader.id,
      title: group.name,
      startsAt,
      status:
        weekIndex === 0 && group.index % 8 === 0
          ? EventStatus.CHECKIN_OPEN
          : EventStatus.SCHEDULED,
      locationName: `Casa Performance ${String(group.index + 1).padStart(2, "0")}`,
      scheduleStartsAt: startsAt,
    });
  }
}

async function createSignalsAndCare({
  churchId,
  groups,
}: {
  churchId: string;
  groups: PerformanceGroup[];
}) {
  for (const group of groups) {
    const urgentMember = group.members[0];
    const attentionMember = group.members[1] ?? urgentMember;
    const caredMember = group.members[2] ?? attentionMember;

    await prisma.careSignal.createMany({
      data: [
        {
          churchId,
          groupId: group.id,
          personId: urgentMember.id,
          assignedToId: group.supervisor.id,
          source: SignalSource.ATTENDANCE,
          severity: SignalSeverity.URGENT,
          status: SignalStatus.OPEN,
          reason: "Ausências recorrentes detectadas no cenário de performance.",
          evidence:
            "Pessoa ficou ausente nos encontros recentes do seed de carga.",
          lastEvidenceAt: addWeeks(-1, 20),
        },
        {
          churchId,
          groupId: group.id,
          personId: attentionMember.id,
          assignedToId: group.leader.id,
          source: SignalSource.MANUAL,
          severity: SignalSeverity.ATTENTION,
          status:
            group.index % 4 === 0 ? SignalStatus.RESOLVED : SignalStatus.OPEN,
          reason: "Acompanhamento pastoral em observação.",
          evidence: "Cenário de volume para listar sinais e prioridades.",
          detectedAt: addWeeks(-2, 18),
          lastEvidenceAt: addWeeks(-1, 18),
          resolvedAt: group.index % 4 === 0 ? addDays(-2, 12) : null,
        },
      ],
    });

    await createSeedCareTouch({
      prisma,
      churchId,
      personId: caredMember.id,
      groupId: group.id,
      actorId: group.leader.id,
      kind: group.index % 3 === 0 ? CareKind.VISIT : CareKind.WHATSAPP,
      note: "Registro de cuidado criado pelo seed de performance.",
      happenedAt: addDays(-((group.index % 21) + 1), 15),
    });
  }
}

async function main() {
  const config = readConfig();

  console.log("Preparando seed de performance", config);
  await clearDatabase(prisma);

  const passwordHash = await hash(PASSWORD, 10);
  const generatedUntil = addWeeks(config.futureWeeks + 2, 23);

  const church = await prisma.church.create({
    data: {
      name: "Igreja Koinonia Performance",
      slug: "koinonia-performance",
      timezone: "America/Sao_Paulo",
    },
  });

  await createUser({
    churchId: church.id,
    name: "Admin Performance",
    email: "admin@koinonia.local",
    role: UserRole.ADMIN,
    passwordHash,
  });

  await createUser({
    churchId: church.id,
    name: "Pastor Performance",
    email: "pastor@koinonia.local",
    role: UserRole.PASTOR,
    passwordHash,
  });

  const supervisors = await Promise.all(
    Array.from({ length: config.supervisors }, (_, index) =>
      createUser({
        churchId: church.id,
        name: `Supervisor Performance ${String(index + 1).padStart(2, "0")}`,
        email: `supervisor${String(index + 1).padStart(2, "0")}@koinonia.local`,
        role: UserRole.SUPERVISOR,
        passwordHash,
      }),
    ),
  );

  const leaders = await Promise.all(
    Array.from({ length: config.groups }, (_, index) =>
      createUser({
        churchId: church.id,
        name: `Líder Performance ${String(index + 1).padStart(2, "0")}`,
        email: `lider${String(index + 1).padStart(2, "0")}@koinonia.local`,
        role: UserRole.LEADER,
        passwordHash,
      }),
    ),
  );

  const groups: PerformanceGroup[] = [];

  for (let groupIndex = 0; groupIndex < config.groups; groupIndex += 1) {
    const group = await createPerformanceGroup({
      churchId: church.id,
      groupIndex,
      leader: leaders[groupIndex],
      supervisor: supervisors[groupIndex % supervisors.length],
      membersPerGroup: config.membersPerGroup,
      generatedUntil,
    });

    groups.push(group);
  }

  for (const group of groups) {
    await createCompletedMeetings({
      churchId: church.id,
      group,
      completedWeeks: config.completedWeeks,
    });

    await createFutureMeetings({
      churchId: church.id,
      group,
      futureWeeks: config.futureWeeks,
    });
  }

  await createSignalsAndCare({ churchId: church.id, groups });

  const totalEvents =
    config.groups * (config.completedWeeks + config.futureWeeks);
  const totalAttendances =
    config.groups * config.membersPerGroup * config.completedWeeks;
  const [
    persistedEvents,
    persistedAttendances,
    scheduledEvents,
    completedEvents,
  ] = await Promise.all([
    prisma.event.count({ where: { churchId: church.id } }),
    prisma.attendance.count(),
    prisma.event.count({
      where: { churchId: church.id, status: EventStatus.SCHEDULED },
    }),
    prisma.event.count({
      where: { churchId: church.id, status: EventStatus.COMPLETED },
    }),
  ]);

  console.log("Seed de performance concluído.");
  console.table({
    igreja: church.slug,
    grupos: config.groups,
    supervisores: config.supervisors,
    lideres: config.groups,
    membros: config.groups * config.membersPerGroup,
    eventosPrevistos: totalEvents,
    eventosGravados: persistedEvents,
    encontrosAgendados: scheduledEvents,
    encontrosConcluidos: completedEvents,
    presencasPrevistas: totalAttendances,
    presencasGravadas: persistedAttendances,
    sinais: config.groups * 2,
    cuidados: config.groups,
    senha: PASSWORD,
  });
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed de performance", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
