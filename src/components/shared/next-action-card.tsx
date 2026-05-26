import type { ReactNode } from "react";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { ActionPill } from "@/components/ui/action-pill";
import { CardLink } from "@/components/ui/card-link";
import type { CardPriorityTone } from "@/lib/card-priority";
import styles from "./next-action-card.module.css";

export type NextActionTone = "risk" | "support" | "warn" | "care" | "presence" | "ok";

const priorityTone: Record<NextActionTone, CardPriorityTone> = {
  risk: "risk",
  support: "support",
  warn: "warn",
  care: "care",
  presence: "presence",
  ok: "stable",
};

export type NextAction = {
  eyebrow?: string;
  title: string;
  detail: string;
  href: string;
  label: string;
  tone: NextActionTone;
};

export function NextActionCard({
  action,
  className,
  icon,
}: {
  action: NextAction;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <CardLink
      href={action.href}
      padding="sm"
      radius="default"
      containment="hidden"
      surface="spotlightCompact"
      priorityTone={priorityTone[action.tone]}
      className={["group", className].filter(Boolean).join(" ")}
      aria-label={`${action.eyebrow ?? "Próxima ação"}: ${action.title}. ${action.label}`}
    >
      <span className={styles.content}>
        <span className={styles.iconWrap} aria-hidden="true">
          {icon ?? <HeartHandshake className="h-5 w-5" strokeWidth={2.1} />}
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
