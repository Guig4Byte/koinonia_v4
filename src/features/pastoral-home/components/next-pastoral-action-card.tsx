import { NextActionCard, type NextAction, type NextActionTone } from "@/components/shared/next-action-card";

export type NextPastoralActionTone = NextActionTone;
export type NextPastoralAction = NextAction;

export function NextPastoralActionCard({ action, className }: { action: NextPastoralAction; className?: string }) {
  return <NextActionCard action={action} className={["mb-4", className].filter(Boolean).join(" ")} />;
}
