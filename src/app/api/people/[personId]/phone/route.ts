import { NextRequest } from "next/server";
import { CARE_COPY } from "@/features/care/care-copy";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import { parsePersonPhonePayload, personPhoneErrorMessage } from "@/features/people/person-phone";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parsePersonPhonePayload(await readJsonBody(request));

  if (!parsedBody.ok) {
    return apiError(personPhoneErrorMessage(parsedBody.error) ?? CARE_COPY.errors.invalidPhonePayload, 400);
  }

  const personAccess = await requireCareVisiblePerson(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

  const updatedPerson = await prisma.person.update({
    where: { id: personAccess.person.id },
    data: { phone: parsedBody.phone },
    select: { id: true, phone: true },
  });

  return apiOk({
    personId: updatedPerson.id,
    phone: updatedPerson.phone ?? "",
    message: CARE_COPY.feedback.phoneSaved,
  });
}
