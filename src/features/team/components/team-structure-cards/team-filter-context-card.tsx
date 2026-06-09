import { FilterContextCard } from "@/components/shared/filter-context-card";
import type { TeamFilter } from "@/features/team/team-view";
import { filterContextTone } from "./team-structure-cards.constants";

export function TeamFilterContextCard({
  filter,
  title,
  detail,
}: {
  filter: TeamFilter;
  title: string;
  detail: string;
}) {
  return (
    <FilterContextCard title={title} detail={detail} tone={filterContextTone[filter]} />
  );
}
