import { PersonStatus } from "@/generated/prisma/client";
import { canRegisterCare, getOpenSignalInActiveGroupWhere, getVisibleOpenSignalWhere } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;

  const person = await prisma.person.findUnique({
    where: { id: personId },
    include: { memberships: { where: { leftAt: null }, include: { group: { include: { responsibilities: { where: { activeUntil: null } } } } } } },
  });

  if (!person || person.churchId !== user.churchId) {
    return apiError("Pessoa não encontrada", 404);
  }

  if (!canRegisterCare(user, person)) {
    return apiError("Sem permissão para atualizar esta pessoa", 403);
  }

  const visibleOpenSignalWhere = getVisibleOpenSignalWhere(user);
  const [visibleOpenSignalsCount, openSignalsCount] = await Promise.all([
    prisma.careSignal.count({
      where: { ...visibleOpenSignalWhere, personId },
    }),
    prisma.careSignal.count({
      where: { ...getOpenSignalInActiveGroupWhere(user.churchId), personId },
    }),
  ]);

  if (openSignalsCount > 0) {
    const error = visibleOpenSignalsCount > 0
      ? "Ainda há motivo de atenção aberto para esta pessoa. Registre o cuidado antes de marcar como ativo."
      : "Ainda há motivo de atenção aberto fora do seu recorte atual. Peça apoio antes de marcar como ativo.";

    return apiError(error, 409);
  }

  await prisma.person.updateMany({
    where: { id: personId, churchId: user.churchId, status: PersonStatus.COOLING_AWAY },
    data: { status: PersonStatus.ACTIVE },
  });

  return apiOk({ status: PersonStatus.ACTIVE });
}
