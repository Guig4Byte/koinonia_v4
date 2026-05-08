import { UserRole } from "@/generated/prisma/client";
import {
  attentionMessage,
  groupPresenceMessage,
  inCareMessage,
  mixedCareMessage,
  stableMessage,
  supportMessage,
  urgentMessage,
} from "./pastoral-pulse-messages";

export type PastoralPulseTone = "calm" | "attention" | "ok";

export type PastoralPulseScope = "leaderDashboard" | "supervisorDashboard" | "pastorDashboard" | "groupDetail";

export type PastoralPulseCounts = {
  urgentOrPastoral?: number;
  support?: number;
  attention?: number;
  inCare?: number;
  hasPendingEvent?: boolean;
  hasRecentPresence?: boolean;
  presenceRate?: number;
};

export type PastoralPulseSubject = {
  personName?: string;
  groupName?: string;
  detail?: string;
};

export type PastoralPulseSubjects = {
  urgentOrPastoral?: PastoralPulseSubject | null;
  support?: PastoralPulseSubject | null;
  attention?: PastoralPulseSubject | null;
  inCare?: PastoralPulseSubject | null;
};

export type PastoralPulseMessage = {
  title: string;
  subtitle: string;
  tone: PastoralPulseTone;
};

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
