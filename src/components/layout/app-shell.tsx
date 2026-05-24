import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { BottomNav, type NavItem } from "@/components/layout/bottom-nav";
import { TextSizeToggle } from "@/components/layout/text-size-toggle";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
    <main className={cn("safe-page", !hideBottomNav && "safe-page-with-nav", hideBottomNav && "safe-page-focus")}>
      <header className={cn("app-header", headerVariant === "compact" && "app-header-compact")}>
        {headerVariant === "compact" ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="app-header-eyebrow">Koinonia</p>
              <p className="app-header-compact-title">
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
                <p className="app-header-eyebrow">Koinonia</p>
                <p className="app-header-role">{roleLabels[role]}</p>
              </div>

              <div className="flex items-center gap-2">
                <TextSizeToggle className="header-action-button" />
                <ThemeToggle className="header-action-button" />
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="app-header-greeting">Olá,</p>
                <h1 className="app-header-title">{firstName}.</h1>
                <p className="app-header-subtitle">Cuidado pastoral em suas mãos.</p>
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
