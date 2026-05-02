import Link from "next/link";
import { CalendarDays, Home, Search, UsersRound, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type NavIcon = "home" | "people" | "calendar" | "search";

export type NavItem = {
  href: string;
  label: string;
  icon: NavIcon;
  active?: boolean;
  attention?: boolean;
};

const iconMap: Record<NavIcon, LucideIcon> = {
  home: Home,
  people: UsersRound,
  calendar: CalendarDays,
  search: Search,
};

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] px-4 pb-[calc(0.55rem+env(safe-area-inset-bottom))]">
      <div
        className="grid gap-1 rounded-[1.35rem] border border-[var(--color-border-card)] bg-[var(--color-bg-tab)] p-1 backdrop-blur-xl shadow-card"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = iconMap[item.icon];

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                "relative flex min-h-[44px] flex-col items-center justify-center rounded-[1rem] px-2 py-1 text-[10px] font-semibold transition active:scale-[0.98]",
                item.active
                  ? "bg-[var(--color-bg-card)] text-[var(--color-tab-label-active)] shadow-[0_1px_8px_rgba(0,0,0,0.08)]"
                  : "text-[var(--color-tab-label-inactive)]",
              )}
            >
              {item.attention ? <span className="absolute right-5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--color-metric-atencoes)]" /> : null}
              <Icon className={cn("h-[18px] w-[18px]", item.active ? "text-[var(--color-tab-active)]" : "text-[var(--color-tab-label-inactive)]")} strokeWidth={2.25} />
              <span className="mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
