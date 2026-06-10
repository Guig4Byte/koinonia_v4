import type { PersonStatus, SignalSeverity, UserRole } from "@/generated/prisma/client";
import type { SupervisorGroup } from "@/features/groups/cells-page-view";
import type { NextPastoralAction, NextPastoralActionTone } from "@/features/pastoral-home/components/next-pastoral-action-card";
import type { FirstUseState } from "@/features/pastoral-home/first-use-state";
import type { PastoralPulseMessage } from "@/features/pastoral-pulse";
import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";

export type SupervisorPageViewer = {
  id: string;
  role: UserRole;
};

export type SupervisorPageSignal = {
  id: string;
  personId: string;
  reason: string;
  severity: SignalSeverity;
  detectedAt?: Date;
  assignedToId?: string | null;
  assignedTo?: { role: UserRole } | null;
  person: { id: string; fullName: string };
  group: { name: string };
};

export type SupervisorPageInCarePerson = {
  id: string;
  fullName: string;
  status: PersonStatus;
  groupName: string;
};

export type SupervisorPageDashboard = {
  attentionPeople: SupervisorPageSignal[];
  groups: SupervisorGroup[];
  upcomingBirthdays?: UpcomingBirthdayItem[];
};

export type SupervisorFocusKey = "urgent" | "support" | "presence" | "attention" | "care";

export type SupervisorFocusItem = {
  key: SupervisorFocusKey;
  valueLabel: string;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
  tone: Exclude<NextPastoralActionTone, "ok">;
};

export type SupervisorPageView = {
  navIndicator?: "risk" | "attention" | "care";
  pastoralPulse: PastoralPulseMessage;
  urgentSignals: SupervisorPageSignal[];
  supportSignals: SupervisorPageSignal[];
  attentionSignals: SupervisorPageSignal[];
  inCarePeople: SupervisorPageInCarePerson[];
  focusItems: SupervisorFocusItem[];
  nextAction: NextPastoralAction | null;
  firstUseState: FirstUseState | null;
};
