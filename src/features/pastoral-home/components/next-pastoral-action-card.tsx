import { ArrowRight, HeartHandshake } from "lucide-react";
import { ActionPill } from "@/components/ui/action-pill";
import { CardLink } from "@/components/ui/card-link";
import type { CardPriorityTone } from "@/lib/card-priority";
import styles from "./next-pastoral-action-card.module.css";

export type NextPastoralActionTone = "risk" | "support" | "warn" | "care" | "ok";

const priorityTone: Record<NextPastoralActionTone, CardPriorityTone> = {
  risk: "risk",
  support: "support",
  warn: "warn",
  care: "care",
  ok: "stable",
};

export type NextPastoralAction = {
  eyebrow?: string;
  title: string;
  detail: string;
  href: string;
  label: string;
  tone: NextPastoralActionTone;
};

export function NextPastoralActionCard({ action, className }: { action: NextPastoralAction; className?: string }) {
  return (
    <CardLink
      href={action.href}
      padding="sm"
      radius="default"
      containment="hidden"
      surface="spotlightCompact"
      priorityTone={priorityTone[action.tone]}
      className={["group mb-4", className].filter(Boolean).join(" ")}
      aria-label={`${action.eyebrow ?? "Próxima ação"}: ${action.title}. ${action.label}`}
    >
      <span className={styles.content}>
        <span className={styles.iconWrap} aria-hidden="true">
          <HeartHandshake className="h-5 w-5" strokeWidth={2.1} />
        </span>
        <span className={styles.copy}>
          <span className={styles.eyebrow}>{action.eyebrow ?? "Próxima ação"}</span>
          <span className={styles.title}>{action.title}</span>
          <span className={styles.detail}>{action.detail}</span>
          <ActionPill tone="prioritySoft" size="sm" iconAfter={<ArrowRight />} shiftIcon pressOnGroupActive className="mt-2.5">
            {action.label}
          </ActionPill>
        </span>
      </span>
    </CardLink>
  );
}
