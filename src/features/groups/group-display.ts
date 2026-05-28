export const FALLBACK_GROUP_NAME = "Sem célula";
export const FALLBACK_LEADER_NAME = "Liderança a definir";
export const FALLBACK_SUPERVISOR_NAME = "Supervisão a definir";

export function groupNameOrFallback(group?: { name?: string | null } | null): string {
  return group?.name ?? FALLBACK_GROUP_NAME;
}

export function leaderNameOrFallback(leader?: { name?: string | null } | null): string {
  return leader?.name ?? FALLBACK_LEADER_NAME;
}

export function supervisorNameOrFallback(supervisor?: { name?: string | null } | null): string {
  return supervisor?.name ?? FALLBACK_SUPERVISOR_NAME;
}
