import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRole } from "../generated/prisma/client";

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
}: {
  userName: string;
  role: UserRole;
  nav: NavItem[];
  children: ReactNode;
}) {
  const firstName = userName.split(" ")[0];

  return (
    <main className="safe-page">
      <header className="app-header">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-brand-accent)]">Koinonia</p>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-on-header)]">{roleLabels[role]}</p>
          </div>

          <ThemeToggle className="header-action-button" />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--color-text-on-header)] opacity-80">Boa noite,</p>
            <h1 className="font-serif-display mt-1 text-[2.35rem] font-semibold leading-none tracking-[-0.03em] text-[var(--color-text-on-header)]">
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
      <BottomNav items={nav} />
    </main>
  );
}
