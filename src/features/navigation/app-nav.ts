import type { NavIndicatorTone, NavItem } from "@/components/bottom-nav";
import { UserRole } from "../../generated/prisma/client";

type UserWithRole = { role: UserRole };

export type AppNavActive = "home" | "secondary" | "events" | "none";

export function homeHrefForRole(role: UserRole) {
  if (role === UserRole.LEADER) return "/lider";
  if (role === UserRole.SUPERVISOR) return "/supervisor";

  return "/pastor";
}

export function secondaryNavForRole(role: UserRole): NavItem {
  if (role === UserRole.LEADER) {
    return { href: "/pessoas", label: "Membros", icon: "people" };
  }

  if (role === UserRole.SUPERVISOR) {
    return { href: "/celulas", label: "Células", icon: "people" };
  }

  return { href: "/equipe", label: "Equipe", icon: "people" };
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
      href: "/eventos",
      label: "Eventos",
      icon: "calendar",
      active: active === "events",
      indicator: active === "events" ? options.indicator : undefined,
    },
  ];
}
