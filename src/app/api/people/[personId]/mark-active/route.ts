import { CARE_COPY } from "@/features/care/care-copy";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import { markPersonActiveAfterCare } from "@/features/care/person-status-actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";

export async function POST(_request: Request, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;

  const personAccess = await requireCareVisiblePerson(user, personId, {
    forbiddenMessage: CARE_COPY.errors.noUpdatePermission,
  });

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

  const result = await markPersonActiveAfterCare(user, personId);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
