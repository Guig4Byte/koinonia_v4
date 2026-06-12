import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";
import {
  eventCheckInPayloadSchema,
  registerEventCheckIn,
} from "@/features/events/event-check-in-command";

export async function POST(request: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  const { eventId } = await context.params;
  const json = await readJsonBody(request);
  const parsedBody = eventCheckInPayloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return apiError("Dados de presença inválidos", 400);
  }

  const result = await registerEventCheckIn(user, eventId, parsedBody.data);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
