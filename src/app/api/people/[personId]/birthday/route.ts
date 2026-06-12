import { NextRequest } from "next/server";
import { parsePersonBirthdayPayload, personBirthdayErrorMessage } from "@/features/people/person-birthday";
import { updateCareVisiblePersonBirthday } from "@/features/people/person-profile-commands";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";

export async function PATCH(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parsePersonBirthdayPayload(await readJsonBody(request));

  if (!parsedBody.ok) {
    return apiError(personBirthdayErrorMessage(parsedBody.error) ?? "Data de aniversário inválida.", 400);
  }

  const result = await updateCareVisiblePersonBirthday(user, personId, parsedBody.birthDate);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
