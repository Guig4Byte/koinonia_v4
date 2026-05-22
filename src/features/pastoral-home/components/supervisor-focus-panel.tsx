import { AlertCircle, ArrowRight, CalendarDays, HeartHandshake, Info, UsersRound, type LucideIcon } from "lucide-react";
import { ActionPill } from "@/components/ui/action-pill";
import { CardLink } from "@/components/ui/card-link";
import { NextActionCard } from "@/components/shared/next-action-card";
import type { SupervisorFocusItem, SupervisorFocusKey } from "@/features/pastoral-home/supervisor-page-view";
import type { CardPriorityTone } from "@/lib/card-priority";
import styles from "./supervisor-focus-panel.module.css";

const iconMap: Record<SupervisorFocusKey, LucideIcon> = {
  urgent: AlertCircle,
  support: UsersRound,
  presence: CalendarDays,
  attention: Info,
  care: HeartHandshake,
};

const priorityToneMap = {
  risk: "risk",
  support: "support",
  warn: "warn",
  care: "care",
} satisfies Record<SupervisorFocusItem["tone"], CardPriorityTone>;

function SecondaryFocusCard({ item }: { item: SupervisorFocusItem }) {
  const Icon = iconMap[item.key];

  return (
    <CardLink
      href={item.href}
      padding="none"
      radius="default"
      elevation="soft"
      containment="hidden"
      accent="left"
      priorityTone={priorityToneMap[item.tone]}
      className={["group", styles.secondaryCard].join(" ")}
      aria-label={`${item.title}: ${item.valueLabel}. ${item.actionLabel}`}
    >
      <span className={styles.secondaryContent}>
        <span className={styles.secondaryIcon} aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={2.15} />
        </span>

        <span className={styles.secondaryCopy}>
          <span className={styles.secondaryTopline}>
            <span className={styles.secondaryEyebrow}>{item.title}</span>
            <span className={styles.secondaryValue}>{item.valueLabel}</span>
          </span>
          <span className={styles.secondaryDetail}>{item.detail}</span>
        </span>

        <ActionPill
          tone="prioritySoft"
          size="xs"
          iconAfter={<ArrowRight />}
          shiftIcon
          pressOnGroupActive
          className={styles.secondaryAction}
        >
          {item.actionLabel}
        </ActionPill>
      </span>
    </CardLink>
  );
}

export function SupervisorFocusPanel({ items }: { items: SupervisorFocusItem[] }) {
  const [primaryItem, ...secondaryItems] = items;

  if (!primaryItem) return null;

  const PrimaryIcon = iconMap[primaryItem.key];

  return (
    <section className={["stagger-children", styles.panel].join(" ")} aria-labelledby="supervisor-focus-title">
      <div className={styles.header}>
        <p className={styles.kicker}>Prioridade pastoral</p>
        <h2 id="supervisor-focus-title" className={styles.title}>O que pede sua atenção agora</h2>
        <p className={styles.detail}>Comece pelo primeiro cuidado e mantenha os outros sinais visíveis para a semana.</p>
      </div>

      <NextActionCard
        icon={<PrimaryIcon className="h-5 w-5" strokeWidth={2.1} />}
        className={styles.primaryCard}
        action={{
          eyebrow: "Primeiro cuidado",
          title: primaryItem.valueLabel,
          detail: primaryItem.detail,
          href: primaryItem.href,
          label: primaryItem.actionLabel,
          tone: primaryItem.tone,
        }}
      />

      {secondaryItems.length > 0 ? (
        <div className={styles.secondaryArea}>
          <div className={styles.secondaryHeader}>
            <strong>Também no radar</strong>
            <span>{secondaryItems.length} {secondaryItems.length === 1 ? "frente" : "frentes"}</span>
          </div>

          <div className={styles.secondaryList}>
            {secondaryItems.map((item) => (
              <SecondaryFocusCard key={item.key} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
