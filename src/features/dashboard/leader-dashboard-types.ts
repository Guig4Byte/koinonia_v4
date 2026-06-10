import type { UserRole } from "@/generated/prisma/client";
import type { RelevantEventCandidate } from "@/features/events/relevant-event";
import type { SignalDetailLike } from "@/features/signals/display";
import type { UpcomingBirthdayItem } from "@/features/people/upcoming-birthdays";
import type { SectionPersonWithIdentity, SectionSignalWithIdentity } from "@/features/signals/sections";

export const LEADER_RELEVANT_EVENT_LOOKBACK_DAYS = 60;
export const LEADER_RELEVANT_EVENT_LIMIT = 20;

export type LeaderPageViewer = {
  id: string;
  role: UserRole;
};

type LeaderPageSignalBase = SectionSignalWithIdentity & SignalDetailLike;

export type LeaderPageSignal = Omit<LeaderPageSignalBase, "assignedTo" | "person" | "reason"> & {
  assignedTo?: { id?: string | null; name?: string | null; role: UserRole } | null;
  person: { id: string; fullName: string };
  reason: string;
};

export type LeaderPageInCarePerson = SectionPersonWithIdentity & {
  fullName: string;
};

export type LeaderCurrentEvent = RelevantEventCandidate & {
  id: string;
  startsAt: Date;
  locationName?: string | null;
  group?: { name?: string | null; locationName?: string | null } | null;
};

export type LeaderDashboard = {
  primaryGroupId: string | null;
  attentionPeople: LeaderPageSignal[];
  inCarePeople: LeaderPageInCarePerson[];
  currentEvent: LeaderCurrentEvent | null;
  hasRecordedMeetings: boolean;
  upcomingBirthdays: UpcomingBirthdayItem[];
};
