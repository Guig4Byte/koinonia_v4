import { PersonStatus, UserRole } from "@/generated/prisma/client";
import { type BadgeTone } from "@/components/ui/badge";
import { type MembersFilter } from "@/features/people/member-filters";
import { type SignalBadgeTone, type SignalDetailLike, type SignalDisplayViewerLike } from "@/features/signals/display";
import { type SectionSignalWithIdentity } from "@/features/signals/sections";
import {
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_STABLE,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";

export type GroupDetailFocus =
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE
  | typeof FILTER_STABLE;

export type GroupDetailFocusCardData = {
  title: string;
  detail: string;
  tone: "default" | "success" | "error" | "warning";
};

export type GroupDetailViewer = SignalDisplayViewerLike & {
  id: string;
  role: UserRole;
};

export type GroupDetailSignal = SectionSignalWithIdentity & SignalDetailLike;

export type GroupDetailMembership = {
  id: string;
  personId: string;
  person: {
    fullName: string;
    status: PersonStatus;
  };
};

export type MemberDisplay = {
  membershipId: string;
  personId: string;
  name: string;
  subtitle?: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  careBadgeLabel?: string;
  careBadgeTone?: BadgeTone;
  cardTone?: SignalBadgeTone | "stable" | "muted";
  priorityRank: number;
  status: PersonStatus;
  focusKeys: GroupDetailFocus[];
};

export type GroupMembersView = {
  members: MemberDisplay[];
  visibleMembers: MemberDisplay[];
  priorityMembers: MemberDisplay[];
  inCareMembers: MemberDisplay[];
  regularMembers: MemberDisplay[];
  filterCounts: Partial<Record<MembersFilter, number>>;
  sectionDetail: string;
  focusedMembersCount: number;
};
