import type { TeamFilter } from "@/features/team/team-filters";
import { teamFilterCopy } from "./team-view.constants";
import type { TeamOverview } from "./team-view.types";

export function teamSavedMessage(savedParam: string) {
  if (savedParam === "celula-criada") return "Célula criada.";
  if (savedParam === "celula-atualizada") return "Célula atualizada.";
  return null;
}

export function teamFilterContent(filter: TeamFilter) {
  return teamFilterCopy[filter];
}

export function teamNavIndicator(summary: TeamOverview["summary"]) {
  if (summary.urgentCount > 0 || summary.pastoralCasesCount > 0)
    return "risk" as const;
  if (summary.groupsNeedingAttentionCount > 0) return "attention" as const;
  return undefined;
}
