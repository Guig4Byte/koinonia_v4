import { isActiveStatus, isInCareStatus } from "@/features/people/person-status";
import {
  FILTER_ACTIVE,
  FILTER_ALL,
  FILTER_ATTENTION,
  FILTER_IN_CARE,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";

export type MembersFilter = typeof FILTER_ALL | typeof FILTER_ATTENTION | typeof FILTER_IN_CARE | typeof FILTER_ACTIVE;

export const MEMBERS_FILTERS: ReadonlyArray<FilterOption<MembersFilter>> = [
  { value: FILTER_ATTENTION, label: "Sinais" },
  { value: FILTER_IN_CARE, label: "Em cuidado" },
  { value: FILTER_ACTIVE, label: "Ativos" },
];

type MemberFilterable = {
  status: string;
  priorityRank: number;
};

type MemberFilterOptions = {
  attentionMaxPriorityRank: number;
  inCarePriorityRank?: number;
  activeMinPriorityRank?: number;
};

const careCardTones = new Set(["risk", "support", "warn", "care"]);

export function readMembersFilter(value: string | null | undefined): MembersFilter {
  if (value === FILTER_ALL) return FILTER_ALL;
  return readFilterParam(MEMBERS_FILTERS, value, FILTER_ATTENTION);
}

export function membersFilterHref(basePath: string, filter: MembersFilter) {
  if (filter === FILTER_ATTENTION) return `${basePath}#membros`;
  if (filter === FILTER_ALL) return `${basePath}?membros=${filter}#membros`;
  return `${basePath}?membros=${filter}#membros`;
}

export function memberCardTone<TTone extends string>(badgeTone: TTone) {
  return careCardTones.has(badgeTone) ? badgeTone as Extract<TTone, "risk" | "support" | "warn" | "care"> : undefined;
}

export function memberMatchesFilter(
  member: MemberFilterable,
  filter: MembersFilter,
  options: MemberFilterOptions,
) {
  if (filter === FILTER_ATTENTION) return member.priorityRank <= options.attentionMaxPriorityRank;

  if (filter === FILTER_IN_CARE) {
    const isInCare = isInCareStatus(member.status);
    return options.inCarePriorityRank === undefined
      ? isInCare
      : isInCare && member.priorityRank === options.inCarePriorityRank;
  }

  if (filter === FILTER_ACTIVE) {
    return isActiveStatus(member.status) && member.priorityRank >= (options.activeMinPriorityRank ?? 5);
  }

  return true;
}
