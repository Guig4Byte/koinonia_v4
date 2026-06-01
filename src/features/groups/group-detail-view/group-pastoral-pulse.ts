import { UserRole } from "@/generated/prisma/client";
import { buildPastoralPulseMessage, type PastoralPulseMessage } from "@/features/pastoral-pulse";

export function groupPastoralPulse({
  role,
  urgentOrPastoralCount,
  supportCount,
  localAttentionCount,
  inCareCount,
  hasRecentPresence,
  presenceRate,
  hasPendingEvent,
}: {
  role: UserRole;
  urgentOrPastoralCount: number;
  supportCount: number;
  localAttentionCount: number;
  inCareCount: number;
  hasRecentPresence: boolean;
  presenceRate: number;
  hasPendingEvent: boolean;
}): PastoralPulseMessage {
  return buildPastoralPulseMessage({
    viewerRole: role,
    scope: "groupDetail",
    counts: {
      urgentOrPastoral: urgentOrPastoralCount,
      support: supportCount,
      attention: localAttentionCount,
      inCare: inCareCount,
      hasRecentPresence,
      presenceRate,
      hasPendingEvent,
    },
  });
}
