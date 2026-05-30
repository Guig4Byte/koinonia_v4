import { NextRequest } from "next/server";
import { SIGNAL_COPY } from "@/features/signals/signal-copy";
import { requestSignalSupport } from "@/features/signals/support-command";
import { parseSignalSupportPayload } from "@/features/signals/support-payload";
import { getCurrentUser } from "@/lib/auth/current-user";
import { apiError, apiOk } from "@/lib/api-response";
import { readJsonBody } from "@/lib/json";

export async function PATCH(request: NextRequest, context: { params: Promise<{ signalId: string }> }) {
  const user = await getCurrentUser();
  const { signalId } = await context.params;
  const payload = parseSignalSupportPayload(await readJsonBody(request));

  if (!payload) {
    return apiError(SIGNAL_COPY.errors.invalidSupportRequest, 400);
  }

  const result = await requestSignalSupport({ user, signalId, payload });

  if (!result.ok) {
    return apiError(result.message, result.status);
  }

  return apiOk(result.data);
}
