import { NextRequest } from "next/server";
import { CARE_COPY } from "@/features/care/care-copy";
import { registerCareAndResolveAttention } from "@/features/care/care-registration";
import { requireCareVisiblePerson } from "@/features/care/person-care-access";
import { parseCarePayload } from "@/features/care/care-validation";
import { hasWholeChurchScope } from "@/features/permissions/permissions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";

export async function POST(request: NextRequest, context: { params: Promise<{ personId: string }> }) {
  const user = await getCurrentUser();
  const { personId } = await context.params;
  const parsedBody = parseCarePayload(await readJsonBody(request));

  if (!parsedBody.success) {
    return apiError(CARE_COPY.errors.invalidPayload, 400);
  }

  const body = parsedBody.data;
  const personAccess = await requireCareVisiblePerson(user, personId);

  if (!personAccess.ok) {
    return apiError(personAccess.message, personAccess.status);
  }

  if (!hasWholeChurchScope(user) && personAccess.visibleGroupIds.length === 0) {
    return apiError(CARE_COPY.errors.noVisibleGroup, 403);
  }

  const result = await registerCareAndResolveAttention({
    user,
    personId,
    kind: body.kind,
    note: body.note,
    resolveOpenSignals: body.resolveOpenSignals,
    visibleGroupIds: personAccess.visibleGroupIds,
  });

  return apiOk({
    careTouchId: result.careTouchId,
    resolvedSignalsCount: result.resolvedSignalsCount,
    personStatusChangedToCare: result.personStatusChangedToCare,
    message: result.message,
  });
}
