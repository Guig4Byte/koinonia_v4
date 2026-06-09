import { hash } from "bcryptjs";
import {
  GroupKind,
  GroupResponsibilityRole,
  MembershipRole,
  PersonStatus,
  UserRole,
} from "../src/generated/prisma/client";
import { prisma } from "../src/lib/prisma";
import { clearDatabase } from "./seed-helpers/cleanup";
import type { SeedMember, SeedUser } from "./seed-helpers/types";
import { createSeedUserWithPerson } from "./seed-helpers/users";

const DEFAULT_PASSWORD = "koinonia123";
const SEMEAR_SEED_PASSWORD = process.env.SEMEAR_SEED_PASSWORD ?? DEFAULT_PASSWORD;

const CHURCH_NAME = "Igreja Koinonia";
const CHURCH_SLUG = "igreja-koinonia";
const BRAZIL_TIMEZONE = "America/Sao_Paulo";

const SEMEAR_GROUP = {
  name: "Célula Semear",
  meetingDayOfWeek: 3,
  meetingTime: "20:00",
  locationName: "Casa dos líderes",
} as const;

const usersSeed = [
  {
    name: "Derbe Aguiar",
    email: "derbe.aguiar@koinonia.local",
    role: UserRole.PASTOR,
    phone: "+5521985711454",
  },
  {
    name: "Fernando Cidade",
    email: "fernando.cidade@koinonia.local",
    role: UserRole.SUPERVISOR,
    phone: "+5521976339943",
  },
  {
    name: "Cibeli",
    email: "cibeli@koinonia.local",
    role: UserRole.SUPERVISOR,
    phone: "+5521985878804",
  },
  {
    name: "Alessandro de Paula",
    email: "alessandro.depaula@koinonia.local",
    role: UserRole.LEADER,
    phone: "+5521971465474",
  },
  {
    name: "Adriana Rosa",
    email: "adriana.rosa@koinonia.local",
    role: UserRole.LEADER,
    phone: "+5521996747561",
  },
] as const;

const membersSeed = [
  { fullName: "Guilherme Pereira", phone: "+5521984429982" },
  { fullName: "Hanna Aguiar", phone: "+5521984621613" },
  { fullName: "Maicon Banni", phone: "+5521985405464" },
  { fullName: "Thaís Enes", phone: "+5521985901964" },
  { fullName: "Luiz Alberto", phone: "+5521967277229" },
  { fullName: "Suelen Braga", phone: "+5521988730362" },
  { fullName: "Wagner Lopes", phone: "+5521987616208" },
  { fullName: "Beatriz Nascimento", phone: "+5521999405582" },
  { fullName: "Fabricia Luiz", phone: "+5521976158373" },
  { fullName: "Romario", phone: "+5521991718891" },
  { fullName: "Hesteffani", phone: "+5521995970534" },
  { fullName: "Ivan Martelete", phone: "+5521971235682" },
  { fullName: "Geisen Macedo", phone: "+5521987946226" },
  { fullName: "Thalita Macedo", phone: "+5521988050125" },
] as const;

async function createSemearUser({
  churchId,
  passwordHash,
  user,
}: {
  churchId: string;
  passwordHash: string;
  user: (typeof usersSeed)[number];
}): Promise<SeedUser> {
  return createSeedUserWithPerson({
    prisma,
    churchId,
    name: user.name,
    email: user.email,
    role: user.role,
    passwordHash,
    phone: user.phone,
    status: PersonStatus.ACTIVE,
  });
}

async function createSemearMembers(churchId: string): Promise<SeedMember[]> {
  return Promise.all(
    membersSeed.map((member) =>
      prisma.person.create({
        data: {
          churchId,
          fullName: member.fullName,
          phone: member.phone,
          status: PersonStatus.ACTIVE,
        },
        select: {
          id: true,
          fullName: true,
        },
      }),
    ),
  );
}

async function main() {
  await clearDatabase(prisma);

  const passwordHash = await hash(SEMEAR_SEED_PASSWORD, 10);
  const church = await prisma.church.create({
    data: {
      name: CHURCH_NAME,
      slug: CHURCH_SLUG,
      timezone: BRAZIL_TIMEZONE,
    },
  });

  const users: SeedUser[] = [];

  for (const user of usersSeed) {
    users.push(
      await createSemearUser({
        churchId: church.id,
        passwordHash,
        user,
      }),
    );
  }

  const [derbe, fernando, cibeli, alessandro, adriana] = users;

  if (!derbe || !fernando || !cibeli || !alessandro || !adriana) {
    throw new Error("Falha ao criar usuários da base Semear.");
  }

  const group = await prisma.smallGroup.create({
    data: {
      churchId: church.id,
      name: SEMEAR_GROUP.name,
      kind: GroupKind.CELL,
      meetingDayOfWeek: SEMEAR_GROUP.meetingDayOfWeek,
      meetingTime: SEMEAR_GROUP.meetingTime,
      locationName: SEMEAR_GROUP.locationName,
      isActive: true,
    },
  });

  await prisma.groupResponsibility.createMany({
    data: [
      {
        churchId: church.id,
        groupId: group.id,
        userId: alessandro.id,
        role: GroupResponsibilityRole.LEADER,
      },
      {
        churchId: church.id,
        groupId: group.id,
        userId: adriana.id,
        role: GroupResponsibilityRole.LEADER,
      },
      {
        churchId: church.id,
        groupId: group.id,
        userId: fernando.id,
        role: GroupResponsibilityRole.SUPERVISOR,
      },
      {
        churchId: church.id,
        groupId: group.id,
        userId: cibeli.id,
        role: GroupResponsibilityRole.SUPERVISOR,
      },
    ],
  });

  const members = await createSemearMembers(church.id);

  await prisma.groupMembership.createMany({
    data: members.map((member) => ({
      groupId: group.id,
      personId: member.id,
      role: MembershipRole.MEMBER,
    })),
  });

  console.info("Seed Semear concluída.");
  console.info(`Igreja: ${CHURCH_NAME}`);
  console.info(`Célula: ${SEMEAR_GROUP.name} — quarta-feira às ${SEMEAR_GROUP.meetingTime}`);
  console.info(`Usuários criados: ${users.length}`);
  console.info(`Membros criados: ${members.length}`);
  console.info("Logins temporários:");
  for (const user of usersSeed) {
    console.info(`- ${user.name}: ${user.email}`);
  }
  console.info(
    process.env.SEMEAR_SEED_PASSWORD
      ? "Senha inicial: definida por SEMEAR_SEED_PASSWORD."
      : `Senha inicial padrão: ${DEFAULT_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
