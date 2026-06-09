import { GroupResponsibilityRole, type PersonStatus } from "@/generated/prisma/client";
import type { PresenceTrend } from "@/features/events/presence-summary";
import type { GroupPastoralSignalLike } from "@/features/groups/group-pastoral-priority";
import type {
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  FILTER_LOW_PRESENCE,
  FILTER_NO_RECENT_PRESENCE,
  FILTER_PASTORAL,
  FILTER_SUPPORT,
  FILTER_URGENT,
} from "@/lib/filter-param";

export type SupervisorGroup = {
  id: string;
  name: string;
  responsibilities: Array<{ role: GroupResponsibilityRole; user: { name: string } }>;
  memberships: Array<{ id?: string; person: { id: string; fullName: string; status: PersonStatus } }>;
  signals: GroupPastoralSignalLike[];
  presenceRate: number;
  hasPresenceData: boolean;
  recordedEventsCount?: number;
  presenceTrend?: PresenceTrend | null;
  attentionCount: number;
  supportRequestsCount: number;
  inCareCount: number;
};

export type SupervisorDashboard = {
  groups: SupervisorGroup[];
};

export type GroupSectionKey = "care" | "presence" | "stable";

export type CellsPageView = {
  groups: SupervisorGroup[];
  groupedSections: Array<{ key: GroupSectionKey; title: string; detail: string; groups: SupervisorGroup[] }>;
  groupsNeedingAttentionCount: number;
  groupsWithoutPresenceCount: number;
  navIndicator?: "risk" | "attention" | "care";
  isFiltered: boolean;
};

export type GroupDetailNavigationFocus =
  | typeof FILTER_URGENT
  | typeof FILTER_PASTORAL
  | typeof FILTER_SUPPORT
  | typeof FILTER_ATTENTION
  | typeof FILTER_IN_CARE
  | typeof FILTER_NO_RECENT_PRESENCE
  | typeof FILTER_LOW_PRESENCE;

export type GroupCareStatusKey =
  | "urgent"
  | "pastoral"
  | "support"
  | "attention"
  | "care"
  | "noPresence"
  | "lowPresence";

export type GroupCareStatusSummary = {
  key: GroupCareStatusKey;
  count: number;
  label: string;
};
