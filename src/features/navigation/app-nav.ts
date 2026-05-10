import type { NavIndicatorTone, NavItem } from "@/components/bottom-nav";
import { UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";

type UserWithRole = { role: UserRole };

export type AppNavActive = "home" | "secondary" | "events" | "none";

export function homeHrefForRole(role: UserRole) {
  if (role === UserRole.LEADER) return ROUTES.leader;
  if (role === UserRole.SUPERVISOR) return ROUTES.supervisor;

  return ROUTES.pastor;
}

export function secondaryNavForRole(role: UserRole): NavItem {
  if (role === UserRole.LEADER) {
    return { href: ROUTES.people, label: "Membros", icon: "people" };
  }

  if (role === UserRole.SUPERVISOR) {
    return { href: ROUTES.cells, label: "Células", icon: "people" };
  }

  return { href: ROUTES.team, label: "Equipe", icon: "people" };
}

export function secondaryNavHrefForRole(role: UserRole) {
  return secondaryNavForRole(role).href;
}

export function secondaryNavLabelForRole(role: UserRole) {
  return secondaryNavForRole(role).label;
}

export function appNavForRole(
  userOrRole: UserWithRole | UserRole,
  options: { active?: AppNavActive; indicator?: NavIndicatorTone } = {},
): NavItem[] {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  const active = options.active ?? "none";
  const secondaryNav = secondaryNavForRole(role);

  return [
    {
      href: homeHrefForRole(role),
      label: "Visão",
      icon: "home",
      active: active === "home",
      indicator: active === "home" ? options.indicator : undefined,
    },
    {
      ...secondaryNav,
      active: active === "secondary",
      indicator: active === "secondary" ? options.indicator : undefined,
    },
    {
      href: ROUTES.events,
      label: "Encontros",
      icon: "calendar",
      active: active === "events",
      indicator: active === "events" ? options.indicator : undefined,
    },
  ];
}
