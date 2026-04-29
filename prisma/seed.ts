import { hash } from "bcryptjs";
import {
  AttendanceStatus,
  CareKind,
  EventStatus,
  MembershipRole,
  PersonStatus,
  SignalSeverity,
  SignalSource,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";

function daysFromNow(days: number, hour = 20) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}


let demoPhoneCounter = 0;

function nextDemoPhone() {
  demoPhoneCounter += 1;
  return `+558199${String(demoPhoneCounter).padStart(6, "0")}`;
}

type DemoUser = {
  id: string;
  personId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

type DemoMember = {
  id: string;
  fullName: string;
};

type DemoGroup = {
  id: string;
  key: string;
  name: string;
  leader: DemoUser;
  supervisor: DemoUser;
  members: DemoMember[];
  visitor: DemoMember;
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
};

function memberStatus(groupKey: string, memberIndex: number, eventIndex: number): AttendanceStatus {
  if (groupKey === "esperanca" && memberIndex === 0) return AttendanceStatus.ABSENT;
  if (groupKey === "esperanca" && memberIndex === 1 && eventIndex === 2) return AttendanceStatus.ABSENT;
  if (groupKey === "betel" && memberIndex < 4) return memberIndex === eventIndex ? AttendanceStatus.JUSTIFIED : AttendanceStatus.ABSENT;
  if (groupKey === "semente" && memberIndex === 0) return AttendanceStatus.ABSENT;
  if (groupKey === "graca") return memberIndex < 7 ? AttendanceStatus.ABSENT : AttendanceStatus.PRESENT;
  if (groupKey === "videira" && memberIndex === 0 && eventIndex === 2) return AttendanceStatus.ABSENT;
  if (groupKey === "caminho" && memberIndex === 0 && eventIndex > 0) return AttendanceStatus.ABSENT;
  if ((memberIndex + eventIndex) % 9 === 0) return AttendanceStatus.JUSTIFIED;
  if ((memberIndex + eventIndex) % 7 === 0) return AttendanceStatus.ABSENT;
  return AttendanceStatus.PRESENT;
}

async function createUserWithPerson({
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
}): Promise<DemoUser> {
  const person = await prisma.person.create({
    data: {
      churchId,
      fullName: name,
      phone: nextDemoPhone(),
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
  leader: DemoUser;
  supervisor: DemoUser;
  meetingDayOfWeek: number;
  meetingTime: string;
  locationName: string;
}): Promise<DemoGroup> {
  const group = await prisma.smallGroup.create({
    data: {
      churchId,
      name,
      kind: "CELL",
      leaderUserId: leader.id,
      supervisorUserId: supervisor.id,
      meetingDayOfWeek,
      meetingTime,
      locationName,
    },
  });

  const members = await Promise.all(
    memberNamesByGroup[key].map((fullName, index) => prisma.person.create({
      data: {
        churchId,
        fullName,
        phone: `+55819${String(91000000 + Object.keys(memberNamesByGroup).indexOf(key) * 1000 + index).padStart(8, "0")}`,
        status: index === 0 && ["esperanca", "semente", "caminho"].includes(key)
          ? PersonStatus.COOLING_AWAY
          : index === 1 && key === "esperanca"
            ? PersonStatus.NEEDS_ATTENTION
            : PersonStatus.ACTIVE,
        shortNote: index === 0 && key === "esperanca" ? "Família pediu oração nas últimas semanas." : undefined,
      },
    })),
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
    members: members.map((member) => ({ id: member.id, fullName: member.fullName })),
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
}: {
  churchId: string;
  group: DemoGroup;
  createdById: string;
  days: number;
  status: EventStatus;
  hour?: number;
}) {
  return prisma.event.create({
    data: {
      churchId,
      groupId: group.id,
      createdById,
      title: group.name,
      startsAt: daysFromNow(days, hour),
      status,
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
  group: DemoGroup;
  personIndex: number;
  assignedToId?: string | null;
  severity: SignalSeverity;
  source: SignalSource;
  reason: string;
  evidence: string;
}) {
  return prisma.careSignal.create({
    data: {
      churchId,
      personId: group.members[personIndex].id,
      groupId: group.id,
      assignedToId,
      source,
      severity,
      reason,
      evidence,
    },
  });
}

async function main() {
  await prisma.careTouch.deleteMany();
  await prisma.careSignal.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.event.deleteMany();
  await prisma.groupMembership.deleteMany();
  await prisma.smallGroup.deleteMany();
  await prisma.user.deleteMany();
  await prisma.person.deleteMany();
  await prisma.church.deleteMany();

  const passwordHash = await hash("koinonia123", 10);

  const church = await prisma.church.create({
    data: { name: "Igreja Koinonia", slug: "koinonia", timezone: "America/Sao_Paulo" },
  });

  const pastor = await createUserWithPerson({
    churchId: church.id,
    name: "Roberto Almeida",
    email: "pastor@koinonia.local",
    role: UserRole.PASTOR,
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

  const bruno = await createUserWithPerson({ churchId: church.id, name: "Bruno Lima", email: "bruno@koinonia.local", role: UserRole.LEADER, passwordHash });
  const carla = await createUserWithPerson({ churchId: church.id, name: "Carla Nascimento", email: "carla@koinonia.local", role: UserRole.LEADER, passwordHash });
  const diego = await createUserWithPerson({ churchId: church.id, name: "Diego Ramos", email: "diego@koinonia.local", role: UserRole.LEADER, passwordHash });
  const fernanda = await createUserWithPerson({ churchId: church.id, name: "Fernanda Alves", email: "fernanda@koinonia.local", role: UserRole.LEADER, passwordHash });
  const gabriel = await createUserWithPerson({ churchId: church.id, name: "Gabriel Torres", email: "gabriel@koinonia.local", role: UserRole.LEADER, passwordHash });
  const juliana = await createUserWithPerson({ churchId: church.id, name: "Juliana Costa", email: "juliana@koinonia.local", role: UserRole.LEADER, passwordHash });
  const lucas = await createUserWithPerson({ churchId: church.id, name: "Lucas Pereira", email: "lucas@koinonia.local", role: UserRole.LEADER, passwordHash });

  const groups = await Promise.all([
    createGroupWithMembers({ churchId: church.id, key: "esperanca", name: "Célula Esperança", leader: bruno, supervisor: ana, meetingDayOfWeek: 5, meetingTime: "20:00", locationName: "Casa do Bruno" }),
    createGroupWithMembers({ churchId: church.id, key: "agape", name: "Célula Ágape", leader: carla, supervisor: ana, meetingDayOfWeek: 4, meetingTime: "19:30", locationName: "Casa da Carla" }),
    createGroupWithMembers({ churchId: church.id, key: "betel", name: "Célula Betel", leader: diego, supervisor: ana, meetingDayOfWeek: 3, meetingTime: "20:00", locationName: "Casa do Diego" }),
    createGroupWithMembers({ churchId: church.id, key: "videira", name: "Célula Videira", leader: fernanda, supervisor: marcos, meetingDayOfWeek: 5, meetingTime: "20:00", locationName: "Casa da Fernanda" }),
    createGroupWithMembers({ churchId: church.id, key: "semente", name: "Célula Semente", leader: gabriel, supervisor: marcos, meetingDayOfWeek: 2, meetingTime: "19:30", locationName: "Casa do Gabriel" }),
    createGroupWithMembers({ churchId: church.id, key: "caminho", name: "Célula Caminho", leader: juliana, supervisor: helena, meetingDayOfWeek: 6, meetingTime: "18:30", locationName: "Casa da Juliana" }),
    createGroupWithMembers({ churchId: church.id, key: "graca", name: "Célula Graça", leader: lucas, supervisor: helena, meetingDayOfWeek: 4, meetingTime: "20:00", locationName: "Casa do Lucas" }),
  ]);

  const churchId = church.id;

  for (const group of groups) {
    await createCompletedEventWithChurch(churchId, group, group.leader.id, -21, 0);
    await createCompletedEventWithChurch(churchId, group, group.leader.id, -14, 1);
    await createCompletedEventWithChurch(churchId, group, group.leader.id, -7, 2);
  }

  const [esperanca, agape, betel, videira, semente, caminho, graca] = groups;

  await createEvent({ churchId, group: esperanca, createdById: bruno.id, days: 0, status: EventStatus.CHECKIN_OPEN, hour: 20 });
  const agapeWeek = await createEvent({ churchId, group: agape, createdById: carla.id, days: -1, status: EventStatus.COMPLETED, hour: 19 });
  const betelWeek = await createEvent({ churchId, group: betel, createdById: diego.id, days: -1, status: EventStatus.COMPLETED, hour: 20 });
  await createEvent({ churchId, group: videira, createdById: fernanda.id, days: 0, status: EventStatus.CHECKIN_OPEN, hour: 20 });
  const sementeWeek = await createEvent({ churchId, group: semente, createdById: gabriel.id, days: -1, status: EventStatus.COMPLETED, hour: 19 });
  await createEvent({ churchId, group: caminho, createdById: juliana.id, days: 1, status: EventStatus.SCHEDULED, hour: 18 });
  const gracaWeek = await createEvent({ churchId, group: graca, createdById: lucas.id, days: -1, status: EventStatus.COMPLETED, hour: 20 });

  for (const [event, group, eventIndex, hasVisitor] of [
    [agapeWeek, agape, 3, true],
    [betelWeek, betel, 3, false],
    [sementeWeek, semente, 3, true],
    [gracaWeek, graca, 3, false],
  ] as const) {
    await prisma.attendance.createMany({
      data: [
        ...group.members.map((member, memberIndex) => ({
          eventId: event.id,
          personId: member.id,
          status: memberStatus(group.key, memberIndex, eventIndex),
        })),
        ...(hasVisitor ? [{ eventId: event.id, personId: group.visitor.id, status: AttendanceStatus.VISITOR }] : []),
      ],
    });
  }

  await createSignal({
    churchId,
    group: esperanca,
    personIndex: 0,
    assignedToId: bruno.id,
    severity: SignalSeverity.URGENT,
    source: SignalSource.ATTENDANCE,
    reason: "3 faltas seguidas. Pode estar se afastando.",
    evidence: "Último pedido: oração pela saúde da família.",
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

  await createSignal({
    churchId,
    group: agape,
    personIndex: 0,
    assignedToId: carla.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.NO_CONTACT,
    reason: "Sem contato recente depois de justificar ausência.",
    evidence: "Bom para validar atenção local que não sobe para o pastor.",
  });

  await createSignal({
    churchId,
    group: betel,
    personIndex: 0,
    assignedToId: ana.id,
    severity: SignalSeverity.URGENT,
    source: SignalSource.ATTENDANCE,
    reason: "Ausências recorrentes e pouca resposta ao líder.",
    evidence: "Urgente aparece ao pastor por gravidade, mesmo atribuído à supervisão.",
  });

  await createSignal({
    churchId,
    group: videira,
    personIndex: 0,
    assignedToId: marcos.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Apoio solicitado para retomar contato.",
    evidence: "Pedido fica no escopo do supervisor Marcos, não vira caso pastoral por padrão.",
  });

  await createSignal({
    churchId,
    group: semente,
    personIndex: 0,
    assignedToId: gabriel.id,
    severity: SignalSeverity.URGENT,
    source: SignalSource.ATTENDANCE,
    reason: "Faltas consecutivas com histórico de esfriamento.",
    evidence: "Caso urgente para validar radar pastoral sem escalonamento explícito.",
  });

  await createSignal({
    churchId,
    group: caminho,
    personIndex: 0,
    assignedToId: pastor.id,
    severity: SignalSeverity.ATTENTION,
    source: SignalSource.MANUAL,
    reason: "Supervisor encaminhou para cuidado pastoral.",
    evidence: "Não é urgente automático, mas aparece ao pastor por encaminhamento explícito.",
  });

  await prisma.careTouch.create({
    data: {
      churchId,
      personId: esperanca.members[2].id,
      groupId: esperanca.id,
      actorId: bruno.id,
      kind: CareKind.MARKED_CARED,
      note: "Conversa rápida após a célula. Sem necessidade de manter em atenção.",
      happenedAt: daysFromNow(-2, 18),
    },
  });

  console.log("Seed concluído.");
  console.log("Estrutura demo: 1 pastor, 3 supervisores, 7 células e 12 membros por célula.");
  console.log("Perfis principais pelo seletor atual: pastor@koinonia.local / ana@koinonia.local / bruno@koinonia.local");
  console.log("Outros usuários demo: marcos@koinonia.local / helena@koinonia.local / carla@koinonia.local / diego@koinonia.local / fernanda@koinonia.local / gabriel@koinonia.local / juliana@koinonia.local / lucas@koinonia.local");
  console.log("Senha: koinonia123");
}

async function createCompletedEventWithChurch(churchId: string, group: DemoGroup, createdById: string, days: number, eventIndex: number, hour = 20) {
  const event = await prisma.event.create({
    data: {
      churchId,
      groupId: group.id,
      createdById,
      title: group.name,
      startsAt: daysFromNow(days, hour),
      status: EventStatus.COMPLETED,
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

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
