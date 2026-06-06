import type { BadgeTone } from "@/components/ui/badge";
import {
  formatPresenceRate,
  presenceTone,
  type PresenceTone,
} from "@/features/events/presence-display";
import { groupPresenceStatusKey } from "@/features/groups/group-pastoral-priority";
import type { CardPriorityTone } from "@/lib/card-priority";

export type GroupCardViewInput = {
  presenceRate: number;
  hasPresenceData: boolean;
  recordedEventsCount?: number;
  badgeTone?: BadgeTone;
  cardTone?: CardPriorityTone;
};

export type GroupCardView = {
  presenceTone: PresenceTone;
  priorityTone?: CardPriorityTone;
  presenceText: string;
  presenceLabel: string;
};

export function resolveGroupCardPriorityTone({
  badgeTone,
  cardTone,
}: Pick<GroupCardViewInput, "badgeTone" | "cardTone">): CardPriorityTone | undefined {
  if (cardTone) return cardTone;

  if (!badgeTone || badgeTone === "neutral" || badgeTone === "ok" || badgeTone === "info") {
    return undefined;
  }

  return badgeTone;
}

export function groupCardPresenceLabel({
  hasPresenceData,
  presenceRate,
  recordedEventsCount,
}: Pick<GroupCardViewInput, "hasPresenceData" | "presenceRate" | "recordedEventsCount">): string {
  const presenceStatus = groupPresenceStatusKey({ hasPresenceData, presenceRate, recordedEventsCount });

  if (presenceStatus === "newWithoutHistory") return "Sem encontros registrados";
  if (presenceStatus === "withoutRecentPresence") return "Sem presença recente";
  if (presenceStatus === "lowPresence") return "Presença baixa";

  return "Presença recente";
}

export function buildGroupCardView(input: GroupCardViewInput): GroupCardView {
  const { presenceRate, hasPresenceData } = input;

  return {
    presenceTone: presenceTone(hasPresenceData, presenceRate),
    priorityTone: resolveGroupCardPriorityTone(input),
    presenceText: formatPresenceRate(hasPresenceData, presenceRate),
    presenceLabel: groupCardPresenceLabel(input),
  };
}
