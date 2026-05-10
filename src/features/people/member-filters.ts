import { isActiveStatus, isInCareStatus } from "@/features/people/person-status";
export type MembersFilter = "todos" | "atencao" | "em-cuidado" | "ativos";

export const MEMBERS_FILTERS: Array<{ value: MembersFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Atenção" },
  { value: "em-cuidado", label: "Em cuidado" },
  { value: "ativos", label: "Ativos" },
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

export function readMembersFilter(value: string): MembersFilter {
  return MEMBERS_FILTERS.some((filter) => filter.value === value) ? value as MembersFilter : "todos";
}

export function membersFilterHref(basePath: string, filter: MembersFilter) {
  if (filter === "todos") return `${basePath}#membros`;
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
  if (filter === "atencao") return member.priorityRank <= options.attentionMaxPriorityRank;

  if (filter === "em-cuidado") {
    const isInCare = isInCareStatus(member.status);
    return options.inCarePriorityRank === undefined
      ? isInCare
      : isInCare && member.priorityRank === options.inCarePriorityRank;
  }

  if (filter === "ativos") {
    return isActiveStatus(member.status) && member.priorityRank >= (options.activeMinPriorityRank ?? 5);
  }

  return true;
}
