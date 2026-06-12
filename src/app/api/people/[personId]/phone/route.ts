import { NextRequest } from "next/server";
import { CARE_COPY } from "@/features/care/care-copy";
import { parsePersonPhonePayload, personPhoneErrorMessage } from "@/features/people/person-phone";
import { updateCareVisiblePersonPhone } from "@/features/people/person-profile-commands";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";

export async function PATCH(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parsePersonPhonePayload(await readJsonBody(request));

  if (!parsedBody.ok) {
    return apiError(personPhoneErrorMessage(parsedBody.error) ?? CARE_COPY.errors.invalidPhonePayload, 400);
  }

  const result = await updateCareVisiblePersonPhone(user, personId, parsedBody.phone);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
