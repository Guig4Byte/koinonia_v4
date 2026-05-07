import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { TextSizeToggle } from "@/components/text-size-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRole } from "@/generated/prisma/client";

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  PASTOR: "Pastor",
  SUPERVISOR: "Supervisor",
  LEADER: "Líder",
};

export function AppShell({
  userName,
  role,
  nav,
  children,
  hideBottomNav = false,
}: {
  userName: string;
  role: UserRole;
  nav: NavItem[];
  children: ReactNode;
  hideBottomNav?: boolean;
}) {
  const firstName = userName.split(" ")[0];

  return (
    <main className={`safe-page${hideBottomNav ? " safe-page-focus" : ""}`}>
      <header className="app-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase text-[var(--color-brand-accent)]">Koinonia</p>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-on-header)]">{roleLabels[role]}</p>
          </div>

          <div className="flex items-center gap-2">
            <TextSizeToggle className="header-action-button" />
            <ThemeToggle className="header-action-button" />
          </div>
        </div>

        <div className="app-header-greeting mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-on-header)] opacity-80">Olá,</p>
            <h1 className="app-header-name font-serif-display mt-1 text-[2.35rem] font-semibold leading-none text-[var(--color-text-on-header)]">
              {firstName}.
            </h1>
          </div>

          <form action="/logout" method="post" className="shrink-0">
            <button
              type="submit"
              aria-label="Sair"
              title="Sair"
              className="header-action-button"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      </header>

      <section className="content-flow">{children}</section>
      {hideBottomNav ? null : <BottomNav items={nav} />}
    </main>
  );
}