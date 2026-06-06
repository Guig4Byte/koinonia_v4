import {
  groupRiskCount,
  hasLowPresence,
  hasNoRecentPresence,
} from "@/features/groups/group-pastoral-priority";
import type { GroupSectionKey, SupervisorGroup } from "@/features/groups/cells-page-view/cells-page-view.types";

export function groupSectionKey(group: SupervisorGroup): GroupSectionKey {
  if (groupRiskCount(group) > 0 || group.supportRequestsCount > 0 || group.attentionCount > 0 || group.inCareCount > 0) {
    return "care";
  }

  if (hasNoRecentPresence(group) || hasLowPresence(group)) {
    return "presence";
  }

  return "stable";
}
