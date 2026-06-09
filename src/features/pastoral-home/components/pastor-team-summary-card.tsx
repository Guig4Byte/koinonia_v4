import Link from "next/link";
import { UsersRound } from "lucide-react";
import type { PastorPageSummaryItem } from "@/features/pastoral-home/pastor-page-view";
import { teamSupervisorsSectionHref } from "@/features/team/team-routes";
import { cn } from "@/lib/cn";
import styles from "./pastor-team-summary-card.module.css";

const valueToneClass: Record<NonNullable<PastorPageSummaryItem["tone"]>, string> = {
  ok: styles.valueOk,
  warn: styles.valueWarn,
  risk: styles.valueRisk,
  neutral: styles.valueNeutral,
};

export function PastorTeamSummaryCard({ items }: { items: PastorPageSummaryItem[] }) {
  return (
    <Link href={teamSupervisorsSectionHref()} className={styles.root} aria-label="Ver equipe pastoral">
      <div className={styles.header}>
        <span className={styles.iconWrap} aria-hidden="true">
          <UsersRound className="h-4 w-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="k-eyebrow mb-1">Equipe pastoral</p>
          <p className={styles.title}>Resumo da equipe</p>
          <p className={styles.description}>Estrutura para acompanhar as células.</p>
        </div>
        <span className={styles.quickLink} aria-hidden="true">Ver →</span>
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <span className={cn(styles.value, valueToneClass[item.tone ?? "neutral"])}>{item.value}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}
