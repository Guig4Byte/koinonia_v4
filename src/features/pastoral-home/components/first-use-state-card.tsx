import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/shared/base-cards";
import { ButtonLink } from "@/components/ui/button-link";
import type { FirstUseState } from "@/features/pastoral-home/first-use-state";

export function FirstUseStateCard({
  state,
  className,
}: {
  state: FirstUseState;
  className?: string;
}) {
  return (
    <EmptyState
      title={state.title}
      className={className}
      action={(
        <ButtonLink href={state.href} variant="actionPillSecondary" size="sm" density="actionPill" responsiveWidth="fullUntilSm">
          {state.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </ButtonLink>
      )}
    >
      {state.detail}
    </EmptyState>
  );
}
