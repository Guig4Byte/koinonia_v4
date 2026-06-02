import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import type { SupervisorFocusItem } from "@/features/pastoral-home/supervisor-page-view/supervisor-page-view.types";

export function buildSupervisorNextPastoralAction(focusItems: SupervisorFocusItem[]): NextPastoralAction | null {
  const primaryFocus = focusItems[0];

  if (!primaryFocus) return null;

  return {
    eyebrow: "Foco de acompanhamento",
    title: primaryFocus.valueLabel,
    detail: primaryFocus.detail,
    href: primaryFocus.href,
    label: primaryFocus.actionLabel,
    tone: primaryFocus.tone,
  };
}
