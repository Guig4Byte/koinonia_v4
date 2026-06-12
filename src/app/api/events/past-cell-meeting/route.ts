import { NextRequest } from "next/server";
import { createPastCellMeeting, pastCellMeetingPayloadSchema } from "@/features/events/past-cell-meeting-command";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  const json = await readJsonBody(request);
  const parsedBody = pastCellMeetingPayloadSchema.safeParse(json);

  if (!parsedBody.success) {
    return apiError("Dados do encontro inválidos", 400);
  }

  const result = await createPastCellMeeting(user, parsedBody.data);

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
