import { prisma } from "../src/lib/prisma";
import { buildLegacyResponsibilityBackfillCandidates } from "../src/features/groups/responsibilities-backfill";

async function main() {
  const groups = await prisma.smallGroup.findMany({
    select: {
      id: true,
      churchId: true,
      leaderUserId: true,
      supervisorUserId: true,
      responsibilities: {
        select: {
          userId: true,
          role: true,
          activeUntil: true,
        },
      },
    },
  });

  const candidates = buildLegacyResponsibilityBackfillCandidates(groups);

  if (candidates.length === 0) {
    console.log("Nenhuma responsabilidade legada para migrar.");
    return;
  }

  const result = await prisma.groupResponsibility.createMany({
    data: candidates,
  });

  console.log(`Responsabilidades criadas: ${result.count}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
