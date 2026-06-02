import { UserRole } from "@/generated/prisma/client";
import { appNavForRole, homeHrefForRole, secondaryNavHrefForRole, secondaryNavLabelForRole } from "@/features/navigation/app-nav";
import { leaderCellHrefFromGroup } from "@/features/navigation/leader-cell-nav";
import type { loadPersonDetailContext } from "./person-detail.loader";

type User = Awaited<ReturnType<typeof loadPersonDetailContext>>["user"];

export function buildPersonDetailShell({
  user,
  primaryGroupId,
  openSignalsCount,
  isInCare,
  hasRiskSignal,
}: {
  user: User;
  primaryGroupId?: string | null;
  openSignalsCount: number;
  isInCare: boolean;
  hasRiskSignal: boolean;
}) {
  const homeHref = homeHrefForRole(user.role);
  const secondaryNavHref = leaderCellHrefFromGroup(user, primaryGroupId) ?? secondaryNavHrefForRole(user.role);
  const secondaryNavLabel = secondaryNavLabelForRole(user.role);
  const isLeader = user.role === UserRole.LEADER;
  const backHref = isLeader ? secondaryNavHref : homeHref;
  const backLabel = isLeader ? secondaryNavLabel : "Visão";
  const navIndicator = hasRiskSignal ? "risk" : openSignalsCount > 0 ? "attention" : isInCare ? "care" : undefined;

  return {
    nav: appNavForRole(user, { active: isLeader ? "secondary" : "none", indicator: navIndicator, secondaryHref: secondaryNavHref }),
    backHref,
    backLabel,
  };
}
