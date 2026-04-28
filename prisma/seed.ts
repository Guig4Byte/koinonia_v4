import { hash } from "bcryptjs";
import { prisma } from "../src/lib/prisma";

function daysFromNow(days: number, hour = 20) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
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
    data: { name: "Igreja Koinonia", slug: "koinonia" },
  });

  const pastorPerson = await prisma.person.create({ data: { churchId: church.id, fullName: "Roberto Almeida", phone: "+5581999990001" } });
  const supervisorPerson = await prisma.person.create({ data: { churchId: church.id, fullName: "Ana Martins", phone: "+5581999990002" } });
  const leaderPerson = await prisma.person.create({ data: { churchId: church.id, fullName: "Bruno Lima", phone: "+5581999990003" } });

  const pastor = await prisma.user.create({ data: { churchId: church.id, personId: pastorPerson.id, name: "Roberto Almeida", email: "pastor@koinonia.local", passwordHash, role: "PASTOR" } });
  const supervisor = await prisma.user.create({ data: { churchId: church.id, personId: supervisorPerson.id, name: "Ana Martins", email: "ana@koinonia.local", passwordHash, role: "SUPERVISOR" } });
  const leader = await prisma.user.create({ data: { churchId: church.id, personId: leaderPerson.id, name: "Bruno Lima", email: "bruno@koinonia.local", passwordHash, role: "LEADER" } });

  const group = await prisma.smallGroup.create({
    data: {
      churchId: church.id,
      name: "Célula Esperança",
      kind: "CELL",
      leaderUserId: leader.id,
      supervisorUserId: supervisor.id,
      meetingDayOfWeek: 5,
      meetingTime: "20:00",
      locationName: "Casa do Bruno",
    },
  });

  const agape = await prisma.smallGroup.create({
    data: {
      churchId: church.id,
      name: "Célula Ágape",
      kind: "CELL",
      leaderUserId: leader.id,
      supervisorUserId: supervisor.id,
      meetingDayOfWeek: 4,
      meetingTime: "19:30",
      locationName: "Casa da Carla",
    },
  });

  const people = await Promise.all([
    prisma.person.create({ data: { churchId: church.id, fullName: "Cláudio Mendes", phone: "+5581999991001", status: "COOLING_AWAY", shortNote: "Pedido de oração pela família." } }),
    prisma.person.create({ data: { churchId: church.id, fullName: "Maria Oliveira", phone: "+5581999991002", status: "VISITOR" } }),
    prisma.person.create({ data: { churchId: church.id, fullName: "Pedro Souza", phone: "+5581999991003", status: "ACTIVE" } }),
    prisma.person.create({ data: { churchId: church.id, fullName: "João Ferreira", phone: "+5581999991004", status: "NEEDS_ATTENTION", shortNote: "Está procurando emprego." } }),
    prisma.person.create({ data: { churchId: church.id, fullName: "Lucia Santos", phone: "+5581999991005", status: "ACTIVE" } }),
  ]);

  for (const person of people.slice(0, 4)) {
    await prisma.groupMembership.create({ data: { groupId: group.id, personId: person.id, role: person.status === "VISITOR" ? "VISITOR" : "MEMBER" } });
  }
  await prisma.groupMembership.create({ data: { groupId: agape.id, personId: people[4].id, role: "MEMBER" } });

  const e1 = await prisma.event.create({ data: { churchId: church.id, groupId: group.id, createdById: leader.id, title: "Célula Esperança", startsAt: daysFromNow(-21), status: "COMPLETED" } });
  const e2 = await prisma.event.create({ data: { churchId: church.id, groupId: group.id, createdById: leader.id, title: "Célula Esperança", startsAt: daysFromNow(-14), status: "COMPLETED" } });
  const e3 = await prisma.event.create({ data: { churchId: church.id, groupId: group.id, createdById: leader.id, title: "Célula Esperança", startsAt: daysFromNow(-7), status: "COMPLETED" } });
  const e4 = await prisma.event.create({ data: { churchId: church.id, groupId: group.id, createdById: leader.id, title: "Célula Esperança", startsAt: daysFromNow(0), status: "CHECKIN_OPEN" } });
  await prisma.event.create({ data: { churchId: church.id, groupId: agape.id, createdById: leader.id, title: "Célula Ágape", startsAt: daysFromNow(-2), status: "COMPLETED" } });

  const [claudio, maria, pedro, joao] = people;
  for (const event of [e1, e2, e3]) {
    await prisma.attendance.createMany({
      data: [
        { eventId: event.id, personId: claudio.id, status: event.id === e1.id ? "PRESENT" : "ABSENT" },
        { eventId: event.id, personId: maria.id, status: "VISITOR" },
        { eventId: event.id, personId: pedro.id, status: "PRESENT" },
        { eventId: event.id, personId: joao.id, status: event.id === e3.id ? "ABSENT" : "PRESENT" },
      ],
    });
  }

  await prisma.attendance.createMany({
    data: [
      { eventId: e4.id, personId: claudio.id, status: "ABSENT" },
      { eventId: e4.id, personId: maria.id, status: "VISITOR" },
      { eventId: e4.id, personId: pedro.id, status: "PRESENT" },
      { eventId: e4.id, personId: joao.id, status: "PRESENT" },
    ],
  });

  await prisma.careSignal.create({
    data: {
      churchId: church.id,
      personId: claudio.id,
      groupId: group.id,
      assignedToId: leader.id,
      source: "ATTENDANCE",
      severity: "URGENT",
      reason: "3 faltas seguidas. Pode estar se afastando.",
      evidence: "Último pedido: saúde da família.",
    },
  });

  await prisma.careSignal.create({
    data: {
      churchId: church.id,
      personId: joao.id,
      groupId: group.id,
      assignedToId: leader.id,
      source: "MANUAL",
      severity: "ATTENTION",
      reason: "Está desempregado e ainda não teve retorno esta semana.",
      evidence: "Anotação curta do líder.",
    },
  });

  console.log("Seed concluído.");
  console.log("Usuários demo: pastor@koinonia.local / ana@koinonia.local / bruno@koinonia.local");
  console.log("Senha: koinonia123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
