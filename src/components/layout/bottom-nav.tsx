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
  /** Legacy flag kept for existing callers. */
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
  risk: "bg-[var(--color-badge-risco-text)]",
  attention: "bg-[var(--color-badge-atencao-text)]",
  care: "bg-[var(--color-badge-cuidado-text)]",
};

const indicatorLabel: Record<NavIndicatorTone, string> = {
  risk: "há algo urgente",
  attention: "há algo que pede atenção",
  care: "há cuidado em andamento",
};

export function BottomNav({ items }: { items: NavItem[] }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed left-1/2 z-50 max-w-[424px] -translate-x-1/2"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + var(--bottom-nav-offset))",
        width: "calc(100% - 24px)",
      }}
    >
      <div
        className="grid h-[var(--bottom-nav-height)] gap-1 rounded-[1.25rem] border border-[var(--color-border-tab)] bg-[var(--color-bg-tab)] p-1 shadow-[var(--color-shadow-nav)] backdrop-blur-xl"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const indicatorTone: NavIndicatorTone | null = item.indicator ?? (item.attention ? "attention" : null);
          const indicatorClassName = indicatorTone ? indicatorClass[indicatorTone] : null;
          const ariaLabel = indicatorTone ? `${item.label}: ${indicatorLabel[indicatorTone]}` : item.label;

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-label={ariaLabel}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                "relative flex min-h-12 flex-col items-center justify-center rounded-[1rem] px-1.5 py-1 text-[length:var(--text-xs)] font-semibold leading-tight transition active:scale-[0.98]",
                item.active
                  ? "bg-[var(--color-bg-tab-active)] text-[color:var(--color-tab-label-active)] shadow-[var(--color-shadow-nav-active)]"
                  : "text-[color:var(--color-tab-label-inactive)] hover:bg-[var(--surface-alt)]",
              )}
            >
              <span className="relative">
                {indicatorClassName ? (
                  <span
                    className={cn(
                      "absolute rounded-full ring-2 ring-[var(--color-bg-tab)]",
                      "-right-1.5 -top-0.5 h-1.5 w-1.5",
                      indicatorClassName,
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "h-[17px] w-[17px]",
                    item.active ? "text-[color:var(--color-tab-active)]" : "text-[color:var(--color-tab-label-inactive)]",
                  )}
                  strokeWidth={2.25}
                />
              </span>
              <span className="mt-0.5 max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
