import { CalendarCheck2, ChartNoAxesCombined, UserRoundCheck, UsersRound, type LucideIcon } from "lucide-react";
import type { PresenceIndicatorContext } from "./presence-metric.types";

const presenceContextIcon: Record<PresenceIndicatorContext, LucideIcon> = {
  person: UserRoundCheck,
  cell: UsersRound,
  event: CalendarCheck2,
  attendance: UsersRound,
  overview: ChartNoAxesCombined,
};

export function PresenceContextGlyph({ context, className }: { context: PresenceIndicatorContext; className?: string }) {
  const Icon = presenceContextIcon[context];
  return (
    <Icon
      className={className}
      strokeWidth={2.35}
      absoluteStrokeWidth
      aria-hidden="true"
      focusable="false"
    />
  );
}
