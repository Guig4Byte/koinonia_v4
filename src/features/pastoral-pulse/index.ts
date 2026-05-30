import { UserRole } from "@/generated/prisma/client";
import {
  attentionMessage,
  mixedCareMessage,
  supportMessage,
  urgentMessage,
} from "./priority-messages";
import {
  groupPresenceMessage,
  inCareMessage,
  stableMessage,
} from "./state-messages";
import type { PastoralPulseCounts, PastoralPulseMessage, PastoralPulseScope, PastoralPulseSubjects } from "./types";

export type {
  PastoralPulseCounts,
  PastoralPulseMessage,
  PastoralPulseScope,
  PastoralPulseSubject,
  PastoralPulseSubjects,
  PastoralPulseTone,
} from "./types";

function count(value: number | undefined): number {
  return value ?? 0;
}

function activeCareCategories({ urgentOrPastoral, support, attention, inCare }: Required<Pick<PastoralPulseCounts, "urgentOrPastoral" | "support" | "attention" | "inCare">>): number {
  return [urgentOrPastoral, support, attention, inCare].filter((value) => value > 0).length;
}

function totalCareCount({ urgentOrPastoral, support, attention, inCare }: Required<Pick<PastoralPulseCounts, "urgentOrPastoral" | "support" | "attention" | "inCare">>): number {
  return urgentOrPastoral + support + attention + inCare;
}

export function buildPastoralPulseMessage({
  viewerRole,
  scope,
  counts,
  subjects = {},
}: {
  viewerRole: UserRole;
  scope: PastoralPulseScope;
  counts: PastoralPulseCounts;
  subjects?: PastoralPulseSubjects;
}): PastoralPulseMessage {
  const normalizedCounts = {
    urgentOrPastoral: count(counts.urgentOrPastoral),
    support: scope === "pastorDashboard" ? 0 : count(counts.support),
    attention: scope === "pastorDashboard" ? 0 : count(counts.attention),
    inCare: count(counts.inCare),
  };
  const totalCare = totalCareCount(normalizedCounts);
  const activeCategories = activeCareCategories(normalizedCounts);

  if (totalCare > 1 && activeCategories > 1) {
    return mixedCareMessage(viewerRole, scope, normalizedCounts.urgentOrPastoral);
  }

  if (normalizedCounts.urgentOrPastoral > 0) {
    return urgentMessage(viewerRole, scope, normalizedCounts.urgentOrPastoral, subjects.urgentOrPastoral);
  }

  if (normalizedCounts.support > 0) {
    return supportMessage(viewerRole, scope, normalizedCounts.support, subjects.support);
  }

  if (normalizedCounts.attention > 0) {
    return attentionMessage(viewerRole, scope, normalizedCounts.attention, subjects.attention);
  }

  if (normalizedCounts.inCare > 0) {
    return inCareMessage(viewerRole, scope, normalizedCounts.inCare, subjects.inCare);
  }

  if (scope === "groupDetail") {
    const presenceMessage = groupPresenceMessage(viewerRole, {
      hasPendingEvent: Boolean(counts.hasPendingEvent),
      hasRecentPresence: Boolean(counts.hasRecentPresence),
      presenceRate: count(counts.presenceRate),
    });

    if (presenceMessage) return presenceMessage;
  }

  return stableMessage(scope);
}
