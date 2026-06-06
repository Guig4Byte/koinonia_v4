import { groupPastoralState } from "@/features/groups/group-pastoral-priority";
import type { GroupSectionKey, SupervisorGroup } from "@/features/groups/cells-page-view/cells-page-view.types";

export function groupSectionKey(group: SupervisorGroup): GroupSectionKey {
  const state = groupPastoralState(group);

  if (state.riskCount > 0 || state.supportRequestsCount > 0 || state.attentionCount > 0 || state.inCareCount > 0) {
    return "care";
  }

  if (state.hasNoRecentPresence || state.hasLowPresence) {
    return "presence";
  }

  return "stable";
}
