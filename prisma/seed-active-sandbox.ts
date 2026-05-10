import { hash } from "bcryptjs";
import {
  AttendanceStatus,
  EventStatus,
  PersonStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
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

const password = "koinonia123";

function daysFromNow(days: number, hour = 20, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

type SeedGroup = {
  id: string;
  name: string;
  key: string;
  leader: SeedUser;
  supervisor: SeedUser;
  locationName: string;
  members: SeedMember[];
};

const groupsSeed = [
  {
    key: "esperanca",
    name: "Célula Esperança",
    leaderEmail: "bruno@koinonia.local",
    supervisorEmail: "ana@koinonia.local",
    meetingDayOfWeek: 5,
    meetingTime: "20:00",
    locationName: "Casa de Bruno e Laura",
    members: [
      "Cláudio Mendes",
      "João Ferreira",
      "Pedro Souza",
      "Lucia Santos",
      "Rafael Costa",
      "Beatriz Rocha",
      "Felipe Nunes",
      "Ester Barbosa",
    ],
  },
  {
    key: "betel",
    name: "Célula Betel",
    leaderEmail: "diego@koinonia.local",
    supervisorEmail: "ana@koinonia.local",
    meetingDayOfWeek: 3,
    meetingTime: "20:00",
    locationName: "Casa de Diego e Paula",
    members: [
      "Elias Fernandes",
      "Noemi Carvalho",
      "Davi Monteiro",
      "Sara Batista",
      "Gustavo Prado",
      "Natália Campos",
      "Leandro Freitas",
      "Miriam Assis",
    ],
  },
  {
    key: "videira",
    name: "Célula Videira",
    leaderEmail: "carla@koinonia.local",
    supervisorEmail: "marcos@koinonia.local",
    meetingDayOfWeek: 4,
    meetingTime: "19:30",
    locationName: "Casa de Carla e André",
    members: [
      "Daniel Azevedo",
      "Raquel Soares",
      "Fábio Teixeira",
      "Bianca Moura",
      "Marcelo Reis",
      "Simone Cunha",
      "Jonas Peixoto",
      "Aline Brito",
    ],
  },
] as const;

async function createUserWithPerson({
  churchId,
  name,
  email,
  role,
  passwordHash,
  personName,
}: {
  churchId: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash: string;
  personName?: string;
}): Promise<SeedUser> {
  return createSeedUserWithPerson({
    prisma,
    churchId,
    name,
    email,
    role,
    passwordHash,
    personName,
    phone: null,
  });
}

async function createGroup({
  churchId,
  seed,
  usersByEmail,
}: {
  churchId: string;
  seed: (typeof groupsSeed)[number];
  usersByEmail: Map<string, SeedUser>;
}): Promise<SeedGroup> {
  const leader = usersByEmail.get(seed.leaderEmail);
  const supervisor = usersByEmail.get(seed.supervisorEmail);

  if (!leader || !supervisor) {
    throw new Error(`Usuários da célula ${seed.name} não encontrados.`);
  }

  const group = await createSeedGroupWithResponsibilities({
    prisma,
    churchId,
    name: seed.name,
    leader,
    supervisor,
    meetingDayOfWeek: seed.meetingDayOfWeek,
    meetingTime: seed.meetingTime,
    locationName: seed.locationName,
    eventsGeneratedUntil: daysFromNow(35, 23, 59),
  });

  const members = await Promise.all(
    seed.members.map((fullName, index) =>
      prisma.person.create({
        data: {
          churchId,
          fullName,
          phone: `+5581988${seed.key.length}${String(index + 1).padStart(4, "0")}`,
          status: PersonStatus.ACTIVE,
        },
        select: { id: true, fullName: true },
      }),
    ),
  );

  await createSeedGroupMemberships({
    prisma,
    groupId: group.id,
    members,
  });

  return {
    id: group.id,
    name: group.name,
    key: seed.key,
    leader,
    supervisor,
    locationName: seed.locationName,
    members,
  };
}

async function createCellMeeting({
  churchId,
  group,
  startsAt,
  status,
  withAllPresent = false,
}: {
  churchId: string;
  group: SeedGroup;
  startsAt: Date;
  status: EventStatus;
  withAllPresent?: boolean;
}) {
  const event = await createSeedEvent({
    prisma,
    churchId,
    groupId: group.id,
    createdById: group.leader.id,
    title: group.name,
    startsAt,
    status,
    locationName: group.locationName,
    scheduleStartsAt: startsAt,
  });

  if (withAllPresent) {
    await createSeedAttendanceRecords({
      prisma,
      eventId: event.id,
      records: group.members.map((member) => ({
        personId: member.id,
        status: AttendanceStatus.PRESENT,
      })),
    });
  }

  return event;
}

async function createEventsForGroup(churchId: string, group: SeedGroup) {
  // Três encontros recentes sem presença. Use esses para marcar a mesma pessoa
  // como ausente e ver o sinal nascer pela regra real do check-in.
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(-1, 20),
    status: EventStatus.SCHEDULED,
  });
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(-8, 20),
    status: EventStatus.SCHEDULED,
  });
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(-15, 20),
    status: EventStatus.SCHEDULED,
  });

  // Dois encontros mais antigos com todos presentes para a célula não começar sem
  // nenhum histórico e, ainda assim, sem gerar sinais.
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(-22, 20),
    status: EventStatus.COMPLETED,
    withAllPresent: true,
  });
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(-29, 20),
    status: EventStatus.COMPLETED,
    withAllPresent: true,
  });

  // Encontros futuros para validar agenda/listagem sem interferir nos sinais.
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(6, 20),
    status: EventStatus.SCHEDULED,
  });
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(13, 20),
    status: EventStatus.SCHEDULED,
  });
  await createCellMeeting({
    churchId,
    group,
    startsAt: daysFromNow(20, 20),
    status: EventStatus.SCHEDULED,
  });
}

async function main() {
  await clearDatabase(prisma);

  const passwordHash = await hash(password, 10);

  const church = await prisma.church.create({
    data: {
      name: "Igreja Koinonia",
      slug: "koinonia",
      timezone: "America/Sao_Paulo",
    },
  });

  const users = await Promise.all([
    createUserWithPerson({
      churchId: church.id,
      name: "Admin Koinonia",
      email: "admin@koinonia.local",
      role: UserRole.ADMIN,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Roberto Almeida",
      email: "pastor@koinonia.local",
      role: UserRole.PASTOR,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Ana Martins",
      email: "ana@koinonia.local",
      role: UserRole.SUPERVISOR,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Marcos Duarte",
      email: "marcos@koinonia.local",
      role: UserRole.SUPERVISOR,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Bruno e Laura Lima",
      personName: "Bruno Lima",
      email: "bruno@koinonia.local",
      role: UserRole.LEADER,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Diego e Paula Ramos",
      personName: "Diego Ramos",
      email: "diego@koinonia.local",
      role: UserRole.LEADER,
      passwordHash,
    }),
    createUserWithPerson({
      churchId: church.id,
      name: "Carla e André Nascimento",
      personName: "Carla Nascimento",
      email: "carla@koinonia.local",
      role: UserRole.LEADER,
      passwordHash,
    }),
  ]);

  const usersByEmail = new Map(users.map((user) => [user.email, user]));

  const groups = await Promise.all(
    groupsSeed.map((seed) => createGroup({ churchId: church.id, seed, usersByEmail })),
  );

  for (const group of groups) {
    await createEventsForGroup(church.id, group);
  }

  const [esperanca, betel, videira] = groups;

  console.log("Seed ativa de testes concluída.");
  console.log("Todos os membros começam como Ativo, sem sinais e sem cuidado registrado.");
  console.log("Senha local: koinonia123");
  console.log("Acessos principais:");
  console.log("- Pastor/Admin: pastor@koinonia.local / admin@koinonia.local");
  console.log("- Supervisão: ana@koinonia.local / marcos@koinonia.local");
  console.log("- Liderança: bruno@koinonia.local / diego@koinonia.local / carla@koinonia.local");
  console.log("Cenários para provocar sinais pela UI:");
  console.log(`- Atenção: entre como ${esperanca.leader.email} e marque ${esperanca.members[0].fullName} como ausente em 2 encontros recentes da ${esperanca.name}.`);
  console.log(`- Urgente: marque ${betel.members[0].fullName} como ausente em 3 encontros recentes da ${betel.name}.`);
  console.log(`- Sem sinal: marque ${videira.members[0].fullName} como justificado em encontros recentes da ${videira.name}. Justificativa não conta como falta simples.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
