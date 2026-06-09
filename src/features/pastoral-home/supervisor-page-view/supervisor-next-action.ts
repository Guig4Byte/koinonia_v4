import type { NextPastoralAction } from "@/features/pastoral-home/components/next-pastoral-action-card";
import type { SupervisorGroup } from "@/features/groups/cells-page-view";
import type { SupervisorFocusItem } from "@/features/pastoral-home/supervisor-page-view/supervisor-page-view.types";
import { ROUTES } from "@/lib/routes";

function stableSupervisionAction(groups: SupervisorGroup[]): NextPastoralAction | null {
  const singleGroup = groups.length === 1 ? groups[0] : null;

  if (groups.length === 0) return null;

  return {
    eyebrow: "Células supervisionadas",
    title: "Sem pedidos de apoio no momento.",
    detail: singleGroup
      ? `A ${singleGroup.name} está sem pedido aberto no momento. Abra a célula quando quiser revisar presença, membros e cuidado.`
      : "Seu escopo está sem pedido aberto no momento. Abra a lista para revisar presença, membros e cuidado quando precisar.",
    href: singleGroup ? ROUTES.group(singleGroup.id) : ROUTES.cells,
    label: singleGroup ? `Ver ${singleGroup.name}` : "Ver células",
    tone: "ok",
  };
}

export function buildSupervisorNextPastoralAction(focusItems: SupervisorFocusItem[], groups: SupervisorGroup[] = []): NextPastoralAction | null {
  const primaryFocus = focusItems[0];

  if (!primaryFocus) return stableSupervisionAction(groups);

  return {
    eyebrow: "Foco de acompanhamento",
    title: primaryFocus.valueLabel,
    detail: primaryFocus.detail,
    href: primaryFocus.href,
    label: primaryFocus.actionLabel,
    tone: primaryFocus.tone,
  };
}
