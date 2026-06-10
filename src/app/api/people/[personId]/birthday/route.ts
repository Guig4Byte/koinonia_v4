import { NextRequest } from "next/server";
import { CARE_COPY } from "@/features/care/care-copy";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import { parsePersonBirthdayPayload, personBirthdayErrorMessage } from "@/features/people/person-birthday";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parsePersonBirthdayPayload(await readJsonBody(request));

  if (!parsedBody.ok) {
    return apiError(personBirthdayErrorMessage(parsedBody.error) ?? "Data de aniversário inválida.", 400);
  }

  const personAccess = await requireCareVisiblePerson(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

  const updatedPerson = await prisma.person.update({
    where: { id: personAccess.person.id },
    data: { birthDate: parsedBody.birthDate },
    select: { id: true, birthDate: true },
  });

  return apiOk({
    personId: updatedPerson.id,
    birthDate: updatedPerson.birthDate,
    message: parsedBody.birthDate
      ? "Aniversário salvo no perfil da pessoa."
      : "Aniversário removido do perfil da pessoa.",
  });
}
