import Link from "next/link";
import { CalendarDays, Home, Search, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavIcon = "home" | "people" | "calendar" | "search";
export type NavIndicatorTone = "risk" | "attention" | "care";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  active?: boolean;
  /**
   * Legacy flag kept for existing callers. The indicator is only rendered
   * for the active tab so it never looks like another area is also selected.
   */
  attention?: boolean;
  indicator?: NavIndicatorTone;
};

const iconMap: Record<NavIcon, LucideIcon> = {
  home: Home,
  people: UsersRound,
  calendar: CalendarDays,
  search: Search,
};

const indicatorClass: Record<NavIndicatorTone, string> = {
  risk: "bg-[var(--color-badge-risco-border)]",
  attention: "bg-[var(--color-badge-atencao-border)]",
  care: "bg-[var(--color-badge-cuidado-border)]",
};

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] px-4 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
      <div
        className="grid gap-1 rounded-[1.35rem] border border-[var(--color-border-tab)] bg-[var(--color-bg-tab)] p-1 shadow-[var(--color-shadow-nav)] backdrop-blur-[2px]"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const indicatorTone: NavIndicatorTone | null = item.indicator ?? (item.attention ? "attention" : null);
          const indicatorClassName = item.active && indicatorTone ? indicatorClass[indicatorTone] : null;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] flex-col items-center justify-center rounded-[1rem] px-2 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
                item.active
                  ? "bg-[var(--color-bg-tab-active)] text-[var(--color-tab-label-active)] shadow-[var(--color-shadow-nav-active)]"
                  : "text-[var(--color-tab-label-inactive)]",
              )}
            >
              <span className="relative">
                {indicatorClassName ? <span className={cn("absolute -right-1.5 -top-0.5 h-1.5 w-1.5 rounded-full", indicatorClassName)} /> : null}
                <Icon className={cn("h-[18px] w-[18px]", item.active ? "text-[var(--color-tab-active)]" : "text-[var(--color-tab-label-inactive)]")} strokeWidth={2.25} />
              </span>
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
