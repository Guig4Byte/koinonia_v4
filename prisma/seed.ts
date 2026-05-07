import { hash } from "bcryptjs";
import {
  AttendanceStatus,
  CareKind,
  EventStatus,
  GroupResponsibilityRole,
  MembershipRole,
  PersonStatus,
  SignalSeverity,
  SignalSource,
  SignalStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

function daysFromNow(days: number, hour = 20): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function dayInCurrentMonth(day: number, hour = 20): Date {
  const date = new Date();
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
}

let seedPhoneCounter = 0;

function nextSeedPhone(): string {
  seedPhoneCounter += 1;
  return `+558199${String(seedPhoneCounter).padStart(6, "0")}`;
}

type SeedUser = {
  id: string;
  personId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

type SeedMember = {
  id: string;
  fullName: string;
};

type SeedGroup = {
  id: string;
  key: string;
  name: string;
  leader: SeedUser;
  supervisor: SeedUser | null;
  locationName: string;
  members: SeedMember[];
  visitor: SeedMember;
};

const memberNamesByGroup: Record<string, string[]> = {
  esperanca: [
    "Cláudio Mendes",
    "João Ferreira",
    "Pedro Souza",
    "Lucia Santos",
    "Rafael Costa",
    "Beatriz Rocha",
    "Felipe Nunes",
    "Ester Barbosa",
    "Renato Alves",
    "Priscila Lima",
    "Tiago Martins",
    "Marina Lopes",
  ],
  agape: [
    "Rute Almeida",
    "Samuel Vieira",
    "Débora Nunes",
    "André Rocha",
    "Camila Torres",
    "Henrique Barros",
    "Patrícia Gomes",
    "Vitor Cardoso",
    "Larissa Melo",
    "Caio Ribeiro",
    "Elaine Moreira",
    "Mateus Duarte",
  ],
  betel: [
    "Elias Fernandes",
    "Noemi Carvalho",
    "Davi Monteiro",
    "Sara Batista",
    "Gustavo Prado",
    "Natália Campos",
    "Leandro Freitas",
    "Miriam Assis",
    "Bruna Pires",
    "Otávio Lima",
    "Vanessa Tavares",
    "Igor Martins",
  ],
  videira: [
    "Daniel Azevedo",
    "Raquel Soares",
    "Fábio Teixeira",
    "Bianca Moura",
    "Marcelo Reis",
    "Simone Cunha",
    "Jonas Peixoto",
    "Aline Brito",
    "Robson Castro",
    "Letícia Araújo",
    "Paulo Siqueira",
    "Isabela Rangel",
  ],
  semente: [
    "Marta Farias",
    "César Oliveira",
    "Talita Guedes",
    "Eduardo Lins",
    "Priscila Azevedo",
    "Felipe Amaral",
    "Monique Dias",
    "Jorge Macedo",
    "Cecília Pacheco",
    "Alex Teles",
    "Renata Sales",
    "Breno Moraes",
  ],
  caminho: [
    "Sofia Matos",
    "Arthur Neves",
    "Helena Porto",
    "Murilo Coelho",
    "Lívia França",
    "Cauã Mendes",
    "Tainá Xavier",
    "Wesley Ramos",
    "Nádia Correia",
    "Douglas Farias",
    "Giovana Leal",
    "Rômulo Batista",
  ],
  graca: [
    "Tomás Queiroz",
    "Cíntia Braga",
    "Hugo Pimentel",
    "Kelly Machado",
    "Vinícius Ferraz",
    "Lorena Maia",
    "Adriano Mota",
    "Clarice Rezende",
    "Geraldo Lopes",
    "Marília Dantas",
    "Nicolas Barros",
    "Olívia Tavares",
  ],
  semRegistro: [
    "Amanda Paiva",
    "Benício Moura",
    "Cristiane Lopes",
    "Danilo Araújo",
    "Elisa Figueira",
    "Fernando Valença",
    "Gabriela Souza",
    "Heitor Gomes",
    "Iara Melo",
    "Júlio Andrade",
    "Karina Barros",
    "Leonardo Cunha",
  ],
  alianca: [
    "Adriana Castro",
    "Bárbara Nogueira",
    "Caetano Moura",
    "Dulce Farias",
    "Emílio Correia",
    "Flávia Diniz",
    "Gilberto Matos",
    "Heloísa Peixoto",
    "Inácio Freire",
    "Jéssica Prado",
    "Kleber Torres",
    "Lais Cardoso",
  ],
};

const completedEventDays = [-42, -35, -28, -21, -14, -7] as const;
const monthlyPresenceEventSlots = [
  { day: 1, hour: 19 },
  { day: 2, hour: 19 },
  { day: 3, hour: 10 },
  { day: 4, hour: 11 },
] as const;
const currentWeekEventIndex = completedEventDays.length;

const P = AttendanceStatus.PRESENT;
const A = AttendanceStatus.ABSENT;
const J = AttendanceStatus.JUSTIFIED;

const attendanceScenarios: Record<
  string,
  Record<number, AttendanceStatus[]>
> = {
  esperanca: {
    0: [A, A, A, A, A, A],
    1: [P, P, J, P, A, P],
  },
  agape: {
    0: [P, J, P, A, P, J, P],
    2: [P, P, P, J, A, P, P],
  },
  betel: {
    0: [P, A, J, A, A, A, A],
    1: [P, A, P, A, P, A, P],
    2: [P, J, P, J, P, J, P],
    3: [A, P, A, J, A, P, A],
  },
  videira: {
    0: [P, P, J, P, P, A],
  },
  semente: {
    0: [P, P, J, P, A, A, A],
    1: [P, P, P, J, P, P, P],
    4: [A, P, A, P, A, P, A],
    6: [P, P, J, P, P, J, P],
    11: [A, A, P, J, A, P, A],
  },
  caminho: {
    0: [P, J, P, A, A, A],
    1: [P, P, J, P, P, P],
    2: [P, A, P, A, P, A],
  },
  graca: {
    0: [A, A, A, A, A, A, A],
    1: [P, J, P, A, A, A, A],
    2: [P, A, P, A, P, A, P],
    3: [P, P, J, P, P, P, P],
    4: [A, P, A, P, A, P, A],
    5: [P, J, P, J, P, J, P],
    6: [A, A, P, A, A, P, A],
  },
};

function statusFromScenario(pattern: AttendanceStatus[], eventIndex: number) {
  return (
    pattern[eventIndex] ??
    pattern[pattern.length - 1] ??
    AttendanceStatus.PRESENT
  );
}

function memberStatus(
  groupKey: string,
  memberIndex: number,
  eventIndex: number,
): AttendanceStatus {
  const scenario = attendanceScenarios[groupKey]?.[memberIndex];
  if (scenario) return statusFromScenario(scenario, eventIndex);

  if ((memberIndex + eventIndex) % 9 === 0) return AttendanceStatus.JUSTIFIED;
  if ((memberIndex * 2 + eventIndex) % 11 === 0) return AttendanceStatus.ABSENT;
  return AttendanceStatus.PRESENT;
}

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
  const person = await prisma.person.create({
    data: {
      churchId,
      fullName: personName ?? name,
      phone: nextSeedPhone(),
      status: PersonStatus.ACTIVE,
    },
  });

  return prisma.user.create({
    data: {
      churchId,
      personId: person.id,
      name,
      email,
      passwordHash,
      role,
    },
  });
}

async function createGroupWithMembers({
  churchId,
  key,
  name,
  leader,
  supervisor,
  meetingDayOfWeek,
  meetingTime,
  locationName,
}: {
  churchId: string;
  key: string;
  name: string;
  leader: SeedUser;
  supervisor: SeedUser | null;
  meetingDayOfWeek: number;
  meetingTime: string;
  locationName: string;
}): Promise<SeedGroup> {
  const group = await prisma.smallGroup.create({
    data: {
      churchId,
      name,
      kind: "CELL",
      leaderUserId: leader.id,
      supervisorUserId: supervisor?.id ?? null,
      meetingDayOfWeek,
      meetingTime,
      locationName,
    },
  });

  await prisma.groupResponsibility.createMany({
    data: [
      {
        churchId,
        groupId: group.id,
        userId: leader.id,
        role: GroupResponsibilityRole.LEADER,
      },
      ...(supervisor
        ? [
            {
              churchId,
              groupId: group.id,
              userId: supervisor.id,
              role: GroupResponsibilityRole.SUPERVISOR,
            },
          ]
        : []),
    ],
  });

  const members = await Promise.all(
    memberNamesByGroup[key].map((fullName, index) =>
      prisma.person.create({
        data: {
          churchId,
          fullName,
          phone: `+55819${String(91000000 + Object.keys(memberNamesByGroup).indexOf(key) * 1000 + index).padStart(8, "0")}`,
          status:
            index === 0 && key === "esperanca"
              ? PersonStatus.COOLING_AWAY
              : (index === 1 && key === "esperanca") ||
                  (index === 0 && ["semente", "caminho"].includes(key))
                ? PersonStatus.NEEDS_ATTENTION
                : PersonStatus.ACTIVE,
          shortNote:
            index === 0 && key === "esperanca"
              ? "Família pediu oração nas últimas semanas."
              : undefined,
        },
      }),
    ),
  );

  await prisma.groupMembership.createMany({
    data: members.map((member) => ({
      groupId: group.id,
      personId: member.id,
      role: MembershipRole.MEMBER,
    })),
  });

  const visitor = await prisma.person.create({
    data: {
      churchId,
      fullName: `Visitante ${name.replace("Célula ", "")}`,
      status: PersonStatus.VISITOR,
    },
  });

  await prisma.groupMembership.create({
    data: {
      groupId: group.id,
      personId: visitor.id,
      role: MembershipRole.VISITOR,
    },
  });

  return {
    id: group.id,
    key,
    name,
    leader,
    supervisor,
    locationName,
    members: members.map((member) => ({
      id: member.id,
      fullName: member.fullName,
    })),
    visitor: { id: visitor.id, fullName: visitor.fullName },
  };
}

async function createEvent({
  churchId,
  group,
  createdById,
  days,
  status,
  hour = 20,
  locationName,
}: {
  churchId: string;
  group: SeedGroup;
  createdById: string;
  days: number;
  status: EventStatus;
  hour?: number;
  locationName?: string;
}) {
  return prisma.event.create({
    data: {
      churchId,
      groupId: group.id,
      createdById,
      title: group.name,
      startsAt: daysFromNow(days, hour),
      status,
      locationName: locationName ?? group.locationName,
      generatedFromSchedule: true,
    },
  });
}

async function createSignal({
  churchId,
  group,
  personIndex,
  assignedToId,
  severity,
  source,
  reason,
  evidence,
}: {
  churchId: string;
  group: SeedGroup;
  personIndex: number;
  assignedToId?: string | null;
  severity: SignalSeverity;
  source: SignalSource;
  reason: string;
  evidence: string;
}) {
  const personId = group.members[personIndex].id;

  const signal = await prisma.careSignal.create({
    data: {
      churchId,
      personId,
      groupId: group.id,
      assignedToId,
      source,
      severity,
      reason,
      evidence,
    },
  });

  await prisma.person.update({
    where: { id: personId },
    data: { status: PersonStatus.NEEDS_ATTENTION },
  });

  return signal;
}

async function createCareTouch({
  churchId,
  group,
  personIndex,
  actorId,
  kind,
  note,
  days,
  hour,
}: {
  churchId: string;
  group: SeedGroup;
  personIndex: number;
  actorId?: string | null;
  kind: CareKind;
  note?: string | null;
  days: number;
  hour: number;
}) {
  return prisma.careTouch.create({
    data: {
      churchId,
      personId: group.members[personIndex].id,
      groupId: group.id,
      actorId: actorId ?? null,
      kind,
      note: note?.trim() ? note.trim() : null,
      happenedAt: daysFromNow(days, hour),
    },
  });
}

async function main() {
  await prisma.careTouch.deleteMany();
  await prisma.careSignal.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.groupResponsibility.deleteMany();
  await prisma.smallGroup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.person.deleteMany();
  await prisma.church.deleteMany();

  const passwordHash = await hash("koinonia123", 10);

  const church = await prisma.church.create({
    data: {
      name: "Igreja Koinonia",
      slug: "koinonia",
      timezone: "America/Sao_Paulo",
    },
  });

  const pastor = await createUserWithPerson({
    churchId: church.id,
    name: "Roberto Almeida",
    email: "pastor@koinonia.local",
    role: UserRole.PASTOR,
    passwordHash,
  });

  const admin = await createUserWithPerson({
    churchId: church.id,
    name: "Admin Koinonia",
    email: "admin@koinonia.local",
    role: UserRole.ADMIN,
    passwordHash,
  });

  const ana = await createUserWithPerson({
    churchId: church.id,
    name: "Ana Martins",
    email: "ana@koinonia.local",
    role: UserRole.SUPERVISOR,
    passwordHash,
  });

  const marcos = await createUserWithPerson({
    churchId: church.id,
    name: "Marcos Duarte",
    email: "marcos@koinonia.local",
    role: UserRole.SUPERVISOR,
    passwordHash,
  });

  const helena = await createUserWithPerson({
    churchId: church.id,
    name: "Helena Rocha",
    email: "helena@koinonia.local",
    role: UserRole.SUPERVISOR,
    passwordHash,
  });

  const paulo = await createUserWithPerson({
    churchId: church.id,
    name: "Paulo Henrique",
    email: "paulo@koinonia.local",
    role: UserRole.SUPERVISOR,
    passwordHash,
  });

  const bruno = await createUserWithPerson({
    churchId: church.id,
    name: "Bruno e Laura Lima",
    personName: "Bruno Lima",
    email: "bruno@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const carla = await createUserWithPerson({
    churchId: church.id,
    name: "Carla e André Nascimento",
    personName: "Carla Nascimento",
    email: "carla@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const diego = await createUserWithPerson({
    churchId: church.id,
    name: "Diego e Paula Ramos",
    personName: "Diego Ramos",
    email: "diego@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const fernanda = await createUserWithPerson({
    churchId: church.id,
    name: "Fernanda e Rafael Alves",
    personName: "Fernanda Alves",
    email: "fernanda@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const gabriel = await createUserWithPerson({
    churchId: church.id,
    name: "Gabriel e Renata Torres",
    personName: "Gabriel Torres",
    email: "gabriel@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const juliana = await createUserWithPerson({
    churchId: church.id,
    name: "Juliana e Samuel Costa",
    personName: "Juliana Costa",
    email: "juliana@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });
  const lucas = await createUserWithPerson({
    churchId: church.id,
    name: "Lucas e Mariana Pereira",
    personName: "Lucas Pereira",
    email: "lucas@koinonia.local",
    role: UserRole.LEADER,
    passwordHash,
  });

  const groups = await Promise.all([
    createGroupWithMembers({
      churchId: church.id,
      key: "esperanca",
      name: "Célula Esperança",
      leader: bruno,
      supervisor: ana,
      meetingDayOfWeek: 5,
      meetingTime: "20:00",
      locationName: "Casa de Bruno e Laura",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "agape",
      name: "Célula Ágape",
      leader: carla,
      supervisor: ana,
      meetingDayOfWeek: 4,
      meetingTime: "19:30",
      locationName: "Casa de Carla e André",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "betel",
      name: "Célula Betel",
      leader: diego,
      supervisor: ana,
      meetingDayOfWeek: 3,
      meetingTime: "20:00",
      locationName: "Casa de Diego e Paula",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "videira",
      name: "Célula Videira",
      leader: fernanda,
      supervisor: marcos,
      meetingDayOfWeek: 5,
      meetingTime: "20:00",
      locationName: "Casa de Fernanda e Rafael",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "semente",
      name: "Célula Semente",
      leader: gabriel,
      supervisor: marcos,
      meetingDayOfWeek: 2,
      meetingTime: "19:30",
      locationName: "Casa de Gabriel e Renata",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "caminho",
      name: "Célula Caminho",
      leader: juliana,
      supervisor: helena,
      meetingDayOfWeek: 6,
      meetingTime: "18:30",
      locationName: "Casa de Juliana e Samuel",
    }),
    createGroupWithMembers({
      churchId: church.id,
      key: "graca",
      name: "Célula Graça",
      leader: lucas,
      supervisor: helena,
      meetingDayOfWeek: 4,
      meetingTime: "20:00",
      locationName: "Casa de Lucas e Mariana",
    }),
  ]);

  // Cenário de regressão: célula ativa sem eventos registrados deve aparecer como sem registro,
  // não como 0% de presença.
  await createGroupWithMembers({
    churchId: church.id,
    key: "semRegistro",
    name: "Célula Sem Registro",
    leader: bruno,
    supervisor: ana,
    meetingDayOfWeek: 2,
    meetingTime: "20:00",
    locationName: "Casa da Amanda",
  });

  // Cenário de regressão: célula ativa sem supervisor deve aparecer na seção própria
  // de Equipe e não desaparecer por falta de vínculo de supervisão.
  await createGroupWithMembers({
    churchId: church.id,
    key: "alianca",
    name: "Célula Aliança",
    leader: carla,
    supervisor: null,
    meetingDayOfWeek: 3,
    meetingTime: "20:00",
    locationName: "Casa de Carla e André",
  });

  const churchId = church.id;

  for (const group of groups) {
    for (
      let eventIndex = 0;
      eventIndex < completedEventDays.length;
      eventIndex += 1
    ) {
      await createCompletedEventWithChurch(
        churchId,
        group,
        group.leader.id,
        completedEventDays[eventIndex],
        eventIndex,
      );
    }
  }

  const [esperanca, agape, betel, videira, semente, caminho, graca] = groups;

  await createEvent({
    churchId,
    group: esperanca,
    createdById: bruno.id,
    days: 0,
    status: EventStatus.CHECKIN_OPEN,
    hour: 20,
  });

  // Cenario de regressao: o detalhe da pessoa usa o mes atual para o card
  // "Ritmo de presenca". A Celula Semente garante 4 registros no mes para
  // validar lista condensada, porcentagem mensal e historico recente.
  for (
    let monthEventIndex = 0;
    monthEventIndex < monthlyPresenceEventSlots.length;
    monthEventIndex += 1
  ) {
    const slot = monthlyPresenceEventSlots[monthEventIndex];

    await createCompletedEventAtDate(
      churchId,
      semente,
      gabriel.id,
      dayInCurrentMonth(slot.day, slot.hour),
      monthEventIndex,
      monthEventIndex === 0,
    );
  }
  const agapeWeek = await createEvent({
    churchId,
    group: agape,
    createdById: carla.id,
    days: -1,
    status: EventStatus.COMPLETED,
    hour: 19,
    locationName: "Casa da irmã Maria",
  });
  const betelWeek = await createEvent({
    churchId,
    group: betel,
    createdById: diego.id,
    days: -1,
    status: EventStatus.COMPLETED,
    hour: 20,
  });
  await createEvent({
    churchId,
    group: videira,
    createdById: fernanda.id,
    days: 0,
    status: EventStatus.CHECKIN_OPEN,
    hour: 20,
  });
  await createEvent({
    churchId,
    group: caminho,
    createdById: juliana.id,
    days: 1,
    status: EventStatus.SCHEDULED,
    hour: 18,
  });
  const gracaWeek = await createEvent({
    churchId,
    group: graca,
    createdById: lucas.id,
    days: -1,
    status: EventStatus.COMPLETED,
    hour: 20,
  });

  // Cenário de regressão: evento concluído sem marcação não deve virar 0% de risco.
  // A UI deve tratar como ausência de dado/sem registro.
  await createEvent({
    churchId,
    group: videira,
    createdById: fernanda.id,
    days: -1,
    status: EventStatus.COMPLETED,
    hour: 19,
  });

  // Visitante aparece no check-in como presença de visitante e não vira membro automaticamente.
  // O mesmo visitante pode voltar em outro encontro; duplicidade no mesmo evento é bloqueada pela API de check-in.
  for (const [event, group, eventIndex, hasVisitor] of [
    [agapeWeek, agape, currentWeekEventIndex, true],
    [betelWeek, betel, currentWeekEventIndex, false],
    [gracaWeek, graca, currentWeekEventIndex, false],
  ] as const) {
    await prisma.attendance.createMany({
      data: [
        ...group.members.map((member, memberIndex) => ({
          eventId: event.id,
          personId: member.id,
          status: memberStatus(group.key, memberIndex, eventIndex),
        })),
        ...(hasVisitor
          ? [
              {
                eventId: event.id,
                personId: group.visitor.id,
                status: AttendanceStatus.VISITOR,
              },
            ]
          : []),
      ],
    });
  }

  // Cenário de regressão: sinal resolvido após cuidado. Recalcular presença não deve
  // reabrir este mesmo motivo sem nova evidência posterior ao cuidado.
  await prisma.careSignal.create({
    data: {
      churchId,
      personId: esperanca.members[0].id,
      groupId: esperanca.id,
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.URGENT,
      status: SignalStatus.RESOLVED,
      reason: "4 faltas seguidas. Pode estar se afastando.",
      evidence: "Presença recente indica afastamento.",
      resolvedAt: daysFromNow(-2, 18),
      lastEvidenceAt: daysFromNow(-7, 20),
    },
  });

  await createSignal({
    churchId,
    group: esperanca,
    personIndex: 1,
    assignedToId: ana.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Apoio solicitado à supervisão após tentativa de contato.",
    evidence: "João está desempregado e ainda não respondeu esta semana.",
  });

  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 1,
    actorId: bruno.id,
    kind: CareKind.REQUESTED_SUPPORT,
    note: "Tentei contato por WhatsApp e ligação, mas ainda não consegui conversar com calma.",
    days: -1,
    hour: 13,
  });

  await createSignal({
    churchId,
    group: agape,
    personIndex: 0,
    assignedToId: null,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.NO_CONTACT,
    reason: "Sem contato recente depois de justificar ausência.",
    evidence: "Bom para validar atenção local que não sobe para o pastor.",
  });

  // Cenário de regressão: múltiplos sinais na mesma pessoa devem agregar por pessoa
  // e priorizar severidade antes de recência.
  await prisma.person.update({
    where: { id: graca.members[1].id },
    data: { status: PersonStatus.NEEDS_ATTENTION },
  });

  await createSignal({
    churchId,
    group: graca,
    personIndex: 1,
    assignedToId: null,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.NO_CONTACT,
    reason: "Sem contato recente após ausência simples.",
    evidence: "Sinal mais antigo e menos grave para validar agregação.",
  });

  await prisma.careSignal.create({
    data: {
      churchId,
      personId: graca.members[1].id,
      groupId: graca.id,
      source: SignalSource.ATTENDANCE,
      severity: SignalSeverity.URGENT,
      reason: "Queda rápida de presença com preocupação pastoral.",
      evidence:
        "Sinal urgente deve ser o primário mesmo havendo outro sinal aberto.",
      detectedAt: daysFromNow(-1, 12),
      lastEvidenceAt: daysFromNow(-1, 12),
    },
  });

  // Cenário de regressão: supervisor com múltiplos pedidos sem transformar visão em fila pastoral do pastor.
  await createSignal({
    churchId,
    group: agape,
    personIndex: 2,
    assignedToId: ana.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Apoio solicitado à supervisão para acolhimento.",
    evidence: "Segundo pedido no escopo da supervisora Ana.",
  });

  await createSignal({
    churchId,
    group: betel,
    personIndex: 0,
    assignedToId: ana.id,
    severity: SignalSeverity.URGENT,
    source: SignalSource.ATTENDANCE,
    reason: "Ausências recorrentes e pouca resposta ao líder.",
    evidence:
      "Urgente aparece ao pastor por gravidade, mesmo atribuído à supervisão.",
  });

  await createSignal({
    churchId,
    group: videira,
    personIndex: 0,
    assignedToId: marcos.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Apoio solicitado para retomar contato.",
    evidence:
      "Pedido fica no escopo do supervisor Marcos, não vira caso pastoral por padrão.",
  });

  await createSignal({
    churchId,
    group: semente,
    personIndex: 0,
    assignedToId: null,
    severity: SignalSeverity.URGENT,
    source: SignalSource.ATTENDANCE,
    reason: "Faltas consecutivas com histórico de esfriamento.",
    evidence:
      "Caso urgente para validar radar pastoral sem escalonamento explícito.",
  });

  await createSignal({
    churchId,
    group: caminho,
    personIndex: 0,
    assignedToId: pastor.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Supervisor encaminhou para cuidado pastoral.",
    evidence:
      "Não é urgente automático, mas aparece ao pastor por encaminhamento explícito.",
  });

  await createCareTouch({
    churchId,
    group: caminho,
    personIndex: 0,
    actorId: helena.id,
    kind: CareKind.ESCALATED_TO_PASTOR,
    days: -1,
    hour: 14,
  });

  // Cenário de regressão: cuidado pastoral realizado pelo pastor deve aparecer
  // em Acolhidos em cuidado pastoral, sem misturar cuidado local do líder.
  await prisma.careSignal.create({
    data: {
      churchId,
      personId: caminho.members[1].id,
      groupId: caminho.id,
      assignedToId: pastor.id,
      source: SignalSource.MANUAL,
      severity: SignalSeverity.ATTENTION,
      status: SignalStatus.RESOLVED,
      reason: "Caso encaminhado e acolhido em cuidado pastoral.",
      evidence:
        "Pastor conversou com a família e combinou acompanhamento simples.",
      detectedAt: daysFromNow(-5, 18),
      lastEvidenceAt: daysFromNow(-5, 18),
      resolvedAt: daysFromNow(-1, 18),
    },
  });

  await prisma.careTouch.create({
    data: {
      churchId,
      personId: caminho.members[1].id,
      groupId: caminho.id,
      actorId: pastor.id,
      kind: CareKind.MARKED_CARED,
      note: "Conversa pastoral realizada. Família acolhida e sem novo sinal aberto.",
      happenedAt: daysFromNow(-1, 18),
    },
  });

  await prisma.person.update({
    where: { id: caminho.members[1].id },
    data: { status: PersonStatus.COOLING_AWAY },
  });

  const inactiveGroup = await prisma.smallGroup.create({
    data: {
      churchId,
      name: "Célula Arquivada",
      kind: "CELL",
      leaderUserId: bruno.id,
      supervisorUserId: ana.id,
      meetingDayOfWeek: 5,
      meetingTime: "20:00",
      locationName: "Endereço antigo",
      isActive: false,
    },
  });

  await prisma.groupResponsibility.createMany({
    data: [
      {
        churchId,
        groupId: inactiveGroup.id,
        userId: bruno.id,
        role: GroupResponsibilityRole.LEADER,
      },
      {
        churchId,
        groupId: inactiveGroup.id,
        userId: ana.id,
        role: GroupResponsibilityRole.SUPERVISOR,
      },
    ],
  });

  const inactivePerson = await prisma.person.create({
    data: {
      churchId,
      fullName: "Membro de Célula Arquivada",
      phone: nextSeedPhone(),
      status: PersonStatus.NEEDS_ATTENTION,
      shortNote:
        "Cenário de regressão: não deve aparecer em listas padrão por estar em grupo inativo.",
    },
  });

  await prisma.groupMembership.create({
    data: {
      groupId: inactiveGroup.id,
      personId: inactivePerson.id,
      role: MembershipRole.MEMBER,
    },
  });

  await prisma.careSignal.create({
    data: {
      churchId,
      personId: inactivePerson.id,
      groupId: inactiveGroup.id,
      source: SignalSource.MANUAL,
      severity: SignalSeverity.URGENT,
      reason: "Sinal de regressão em célula inativa.",
      evidence:
        "Não deve aparecer para pastor, supervisor ou líder nas superfícies padrão.",
    },
  });

  // Cenários para validar o bloco compacto de Cuidado recente no detalhe da pessoa:
  // múltiplos registros, primeiros 3 itens, Ver histórico, registros com e sem anotação
  // e ações atuais do MVP sem transformar canal de contato em classificação administrativa.
  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 0,
    actorId: bruno.id,
    kind: CareKind.REQUESTED_SUPPORT,
    note: "Pedi apoio porque a ausência ficou recorrente e a família pediu oração.",
    days: -8,
    hour: 20,
  });

  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 0,
    actorId: ana.id,
    kind: CareKind.MARKED_CARED,
    days: -6,
    hour: 19,
  });

  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 0,
    actorId: ana.id,
    kind: CareKind.ESCALATED_TO_PASTOR,
    note: "Família pediu uma visita pastoral breve.",
    days: -4,
    hour: 18,
  });

  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 0,
    actorId: pastor.id,
    kind: CareKind.MARKED_CARED,
    days: -3,
    hour: 19,
  });

  await createCareTouch({
    churchId,
    group: esperanca,
    personIndex: 0,
    actorId: bruno.id,
    kind: CareKind.MARKED_CARED,
    note: "Conversa rápida após a célula. Pessoa fica em cuidado, sem sinal aberto.",
    days: -2,
    hour: 18,
  });

  console.log("Seed concluído.");
  console.log(
    "Estrutura da seed: 1 admin, 1 pastor, 4 supervisores, 9 células ativas, 1 célula inativa e 12 membros por célula ativa.",
  );
  console.log(
    `Acessos principais: ${pastor.email} / ${admin.email} / ${ana.email} / ${bruno.email}`,
  );
  console.log(
    `Outros usuários da seed: ${marcos.email} / ${helena.email} / ${paulo.email} / ${carla.email} / ${diego.email} / ${fernanda.email} / ${gabriel.email} / ${juliana.email} / ${lucas.email}`,
  );
  console.log(
    "Cenários de regressão: histórico de presença nas células com registro, 4 encontros no mês atual para a Célula Semente, faltas consecutivas, faltas intercaladas, justificativas, urgente sem atribuição, apoio à supervisão, múltiplos sinais, encaminhamento pastoral, cuidado pastoral realizado, histórico compacto de cuidado com e sem anotação, sinal resolvido, célula sem registro, célula sem supervisor, evento sem presença e célula inativa.",
  );
  console.log("Senha local da seed: koinonia123");
}

async function createCompletedEventWithChurch(
  churchId: string,
  group: SeedGroup,
  createdById: string,
  days: number,
  eventIndex: number,
  hour = 20,
) {
  const event = await prisma.event.create({
    data: {
      churchId,
      groupId: group.id,
      createdById,
      title: group.name,
      startsAt: daysFromNow(days, hour),
      status: EventStatus.COMPLETED,
      locationName: group.locationName,
      generatedFromSchedule: true,
    },
  });

  await prisma.attendance.createMany({
    data: group.members.map((member, memberIndex) => ({
      eventId: event.id,
      personId: member.id,
      status: memberStatus(group.key, memberIndex, eventIndex),
    })),
  });

  return event;
}

async function createCompletedEventAtDate(
  churchId: string,
  group: SeedGroup,
  createdById: string,
  startsAt: Date,
  eventIndex: number,
  hasVisitor = false,
) {
  const event = await prisma.event.create({
    data: {
      churchId,
      groupId: group.id,
      createdById,
      title: group.name,
      startsAt,
      status: EventStatus.COMPLETED,
      locationName: group.locationName,
      generatedFromSchedule: true,
    },
  });

  await prisma.attendance.createMany({
    data: [
      ...group.members.map((member, memberIndex) => ({
        eventId: event.id,
        personId: member.id,
        status: memberStatus(group.key, memberIndex, eventIndex),
      })),
      ...(hasVisitor
        ? [
            {
              eventId: event.id,
              personId: group.visitor.id,
              status: AttendanceStatus.VISITOR,
            },
          ]
        : []),
    ],
  });

  return event;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
