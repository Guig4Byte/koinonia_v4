import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/bottom-nav";
import { TextSizeToggle } from "@/components/text-size-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserRole } from "@/generated/prisma/client";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";

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
  headerVariant = "full",
}: {
  userName: string;
  role: UserRole;
  nav: NavItem[];
  children: ReactNode;
  hideBottomNav?: boolean;
  headerVariant?: "full" | "compact";
}) {
  const firstName = userName.split(" ")[0];

  return (
    <main className={`safe-page${hideBottomNav ? " safe-page-focus" : ""}`}>
      <header className={cn("app-header", headerVariant === "compact" && "app-header-compact")}>
        {headerVariant === "compact" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[length:var(--text-xs)] font-bold uppercase text-[color:var(--color-brand-accent)]">Koinonia</p>
              <p className="mt-1 truncate text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-on-header)]">
                {roleLabels[role]} · Olá, {firstName}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <TextSizeToggle className="header-action-button" />
              <ThemeToggle className="header-action-button" />
              <form action={ROUTES.logout} method="post">
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
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[length:var(--text-xs)] font-bold uppercase text-[color:var(--color-brand-accent)]">Koinonia</p>
                <p className="mt-1 text-[length:var(--text-xs)] font-semibold text-[color:var(--color-text-on-header)]">{roleLabels[role]}</p>
              </div>

              <div className="flex items-center gap-2">
                <TextSizeToggle className="header-action-button" />
                <ThemeToggle className="header-action-button" />
              </div>
            </div>

            <div className="app-header-greeting mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[length:var(--text-sm)] text-[color:var(--color-text-on-header)] opacity-80">Olá,</p>
                <h1 className="app-header-name font-serif-display mt-1 text-[length:var(--text-hero)] font-semibold leading-none text-[color:var(--color-text-on-header)]">
                  {firstName}.
                </h1>
              </div>

              <form action={ROUTES.logout} method="post" className="shrink-0">
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
          </>
        )}
      </header>

      <section className="content-flow">{children}</section>
      {hideBottomNav ? null : <BottomNav items={nav} />}
    </main>
  );
}
