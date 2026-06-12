import { markCareVisiblePersonActiveAfterCare } from "@/features/care/person-status-actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";

export async function POST(_request: Request, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const result = await markCareVisiblePersonActiveAfterCare(user, personId);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
