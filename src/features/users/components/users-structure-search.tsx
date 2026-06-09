"use client";

import {
  StructureSearch,
  type StructureSearchConfig,
} from "@/components/shared/structure-search";
import {
  USERS_FILTERS,
  type UsersFilter,
} from "@/features/users/user-filters";
import { FILTER_ALL } from "@/lib/filter-param";
import { ROUTES } from "@/lib/routes";

type UsersStructureSearchProps = {
  query: string;
  filter: UsersFilter;
  sectionId: string;
};

const USERS_STRUCTURE_SEARCH_CONFIG = {
  basePath: ROUTES.users,
  defaultFilter: FILTER_ALL,
  filters: USERS_FILTERS,
  ariaLabel: "Buscar usuário",
  placeholder: "Buscar nome, e-mail ou telefone...",
} satisfies StructureSearchConfig<UsersFilter>;

export function UsersStructureSearch(props: UsersStructureSearchProps) {
  return <StructureSearch {...USERS_STRUCTURE_SEARCH_CONFIG} {...props} />;
}
