import { switchDemoRole } from "@/app/actions";
import { UserRole } from "../generated/prisma/client";
import { cn } from "@/lib/cn";

const labels: Record<UserRole, string> = {
  ADMIN: "Admin",
  PASTOR: "Pastor",
  SUPERVISOR: "Supervisor",
  LEADER: "Líder",
};

export function RoleSwitcher({ currentRole }: { currentRole: UserRole }) {
  const roles = [UserRole.PASTOR, UserRole.SUPERVISOR, UserRole.LEADER];

  return (
    <form
      action={switchDemoRole}
      className="grid grid-cols-3 gap-1 rounded-full border border-[var(--color-segmented-border)] bg-[var(--color-segmented-bg)] p-1"
    >
      {roles.map((role) => {
        const isActive = currentRole === role;

        return (
          <button
            key={role}
            name="role"
            value={role}
            className={cn(
              "rounded-full px-3 py-2 text-xs font-bold transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-accent)]",
              isActive ? "shadow-card" : "opacity-95 hover:opacity-100",
            )}
            style={{
              backgroundColor: isActive ? "var(--color-segmented-active-bg)" : "transparent",
              color: isActive ? "var(--color-segmented-active-text)" : "var(--color-segmented-inactive-text)",
            }}
          >
            {labels[role]}
          </button>
        );
      })}
    </form>
  );
}
