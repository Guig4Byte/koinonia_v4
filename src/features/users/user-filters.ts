import type { UserRole } from "@/generated/prisma/client";
import {
  FILTER_ACTIVE,
  FILTER_ALL,
  readFilterParam,
  type FilterOption,
} from "@/lib/filter-param";

export const USERS_SECTION_ID = "usuarios-cadastrados";
export const USER_FILTER_INACTIVE = "inativos";
export const USER_FILTER_ADMINS = "admins";
export const USER_FILTER_PASTORS = "pastores";
export const USER_FILTER_SUPERVISORS = "supervisores";
export const USER_FILTER_LEADERS = "lideres";

export type UsersFilter =
  | typeof FILTER_ALL
  | typeof FILTER_ACTIVE
  | typeof USER_FILTER_INACTIVE
  | typeof USER_FILTER_ADMINS
  | typeof USER_FILTER_PASTORS
  | typeof USER_FILTER_SUPERVISORS
  | typeof USER_FILTER_LEADERS;

export const USERS_FILTERS: ReadonlyArray<FilterOption<UsersFilter>> = [
  { value: FILTER_ALL, label: "Todos" },
  { value: FILTER_ACTIVE, label: "Ativos", tone: "ok" },
  { value: USER_FILTER_INACTIVE, label: "Inativos", tone: "neutral" },
  { value: USER_FILTER_ADMINS, label: "Admins", tone: "care" },
  { value: USER_FILTER_PASTORS, label: "Pastores", tone: "warn" },
  { value: USER_FILTER_SUPERVISORS, label: "Supervisores", tone: "support" },
  { value: USER_FILTER_LEADERS, label: "Líderes", tone: "neutral" },
];

export function readUsersFilter(value: string | null | undefined): UsersFilter {
  return readFilterParam(USERS_FILTERS, value, FILTER_ALL);
}

export function userRoleForFilter(filter: UsersFilter): UserRole | null {
  if (filter === USER_FILTER_ADMINS) return "ADMIN";
  if (filter === USER_FILTER_PASTORS) return "PASTOR";
  if (filter === USER_FILTER_SUPERVISORS) return "SUPERVISOR";
  if (filter === USER_FILTER_LEADERS) return "LEADER";
  return null;
}
