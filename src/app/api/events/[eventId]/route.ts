import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import { eventDetailsPayloadSchema, updateEventDetails } from "./event-details-command";

export async function PATCH(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const json = await readJsonBody(request);
  const parsedBody = eventDetailsPayloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return apiError("Dados do encontro inválidos", 400);
  }

  const result = await updateEventDetails(user, eventId, parsedBody.data);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
