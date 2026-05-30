import type { BadgeTone } from "@/components/ui/badge";
import {
  DEFAULT_PRESENCE_TONE_THRESHOLDS,
  formatPresenceRate,
  presenceTone,
  type PresenceTone,
} from "@/features/events/presence-display";
import type { CardPriorityTone } from "@/lib/card-priority";

export type GroupCardViewInput = {
  presenceRate: number;
  hasPresenceData: boolean;
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
}: Pick<GroupCardViewInput, "hasPresenceData" | "presenceRate">): string {
  if (!hasPresenceData) return "Sem presença recente";

  return presenceRate < DEFAULT_PRESENCE_TONE_THRESHOLDS.risk
    ? "Presença baixa"
    : "Presença recente";
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
