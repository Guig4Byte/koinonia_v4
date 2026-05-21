import { AlertCircle, CalendarDays, HeartHandshake, Info, UsersRound, type LucideIcon } from "lucide-react";
import { NextActionCard } from "@/components/shared/next-action-card";
import type { SupervisorFocusItem, SupervisorFocusKey } from "@/features/pastoral-home/supervisor-page-view";

const iconMap: Record<SupervisorFocusKey, LucideIcon> = {
  urgent: AlertCircle,
  support: UsersRound,
  presence: CalendarDays,
  attention: Info,
  care: HeartHandshake,
};

export function SupervisorFocusPanel({ items }: { items: SupervisorFocusItem[] }) {
  return (
    <section className="stagger-children grid gap-2">
      {items.map((item, index) => {
        const Icon = iconMap[item.key];

        return (
          <NextActionCard
            key={item.key}
            icon={<Icon className="h-5 w-5" strokeWidth={2.1} />}
            className="mb-0"
            action={{
              eyebrow: index === 0 ? "Foco de acompanhamento" : item.title,
              title: item.valueLabel,
              detail: item.detail,
              href: item.href,
              label: item.actionLabel,
              tone: item.tone,
            }}
          />
        );
      })}
    </section>
  );
}
