import type { SeedPrismaClient } from "./types";

export async function clearDatabase(prisma: SeedPrismaClient) {
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
}
