export type TeamFilter = "todos" | "atencao" | "sem-presenca";

export const TEAM_FILTERS: Array<{ value: TeamFilter; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "atencao", label: "Pedem atenção" },
  { value: "sem-presenca", label: "Sem presença recente" },
];

export function readTeamFilter(value: string): TeamFilter {
  return TEAM_FILTERS.some((filter) => filter.value === value) ? value as TeamFilter : "todos";
}
