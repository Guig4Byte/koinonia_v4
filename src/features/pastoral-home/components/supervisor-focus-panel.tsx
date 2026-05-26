import { CalendarDays, ChevronRight, HeartHandshake, Info, UsersRound, type LucideIcon } from "lucide-react";
import { CardLink } from "@/components/ui/card-link";
import { NextActionCard } from "@/components/shared/next-action-card";
import type { SupervisorFocusItem, SupervisorFocusKey } from "@/features/pastoral-home/supervisor-page-view";
import type { CardPriorityTone } from "@/lib/card-priority";
import styles from "./supervisor-focus-panel.module.css";

const iconMap: Record<SupervisorFocusKey, LucideIcon> = {
  urgent: HeartHandshake,
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
  presence: "presence",
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
          <span className={styles.secondaryEyebrow}>{item.title}</span>
          <span className={styles.secondaryValue}>{item.valueLabel}</span>
          <span className={styles.secondaryDetail}>{item.detail}</span>
        </span>

        <span className={styles.secondaryAction} aria-hidden="true">
          <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
        </span>
      </span>
    </CardLink>
  );
}

export function SupervisorFocusPanel({ items }: { items: SupervisorFocusItem[] }) {
  const [primaryItem, ...secondaryItems] = items;

  if (!primaryItem) return null;

  const PrimaryIcon = iconMap[primaryItem.key];

  return (
    <section className={["stagger-children", styles.panel].join(" ")} aria-label="Prioridades pastorais da supervisão">
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
            <div className={styles.secondaryHeadingCopy}>
              <strong>Também no radar</strong>
              <span>Sinais que seguem visíveis na supervisão.</span>
            </div>
            <span className={styles.secondaryCount}>{secondaryItems.length} {secondaryItems.length === 1 ? "frente" : "frentes"}</span>
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
