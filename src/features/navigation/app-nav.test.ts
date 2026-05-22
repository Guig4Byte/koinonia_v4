import { describe, expect, it } from "vitest";
import { UserRole } from "@/generated/prisma/client";
import { ROUTES } from "@/lib/routes";
import { appNavForRole, homeHrefForRole, secondaryNavForRole } from "./app-nav";

describe("app navigation", () => {
  it("maps the home route for each role", () => {
    expect(homeHrefForRole(UserRole.LEADER)).toBe(ROUTES.leader);
    expect(homeHrefForRole(UserRole.SUPERVISOR)).toBe(ROUTES.supervisor);
    expect(homeHrefForRole(UserRole.PASTOR)).toBe(ROUTES.pastor);
    expect(homeHrefForRole(UserRole.ADMIN)).toBe(ROUTES.pastor);
  });

  it("maps the secondary section for each role", () => {
    expect(secondaryNavForRole(UserRole.LEADER)).toMatchObject({ href: ROUTES.cells, label: "Célula" });
    expect(secondaryNavForRole(UserRole.SUPERVISOR)).toMatchObject({ href: ROUTES.cells, label: "Células" });
    expect(secondaryNavForRole(UserRole.PASTOR)).toMatchObject({ href: ROUTES.team, label: "Equipe" });
    expect(secondaryNavForRole(UserRole.ADMIN)).toMatchObject({ href: ROUTES.team, label: "Equipe" });
  });

  it("marks only the selected tab as active and receives the indicator", () => {
    const nav = appNavForRole(UserRole.LEADER, { active: "secondary", indicator: "attention" });

    expect(nav.map((item) => item.label)).toEqual(["Visão", "Célula", "Encontros"]);
    expect(nav.map((item) => item.active)).toEqual([false, true, false]);
    expect(nav.map((item) => item.indicator)).toEqual([undefined, "attention", undefined]);
  });

  it("keeps a pastoral indicator visible on Visão when no tab is active", () => {
    const nav = appNavForRole(UserRole.PASTOR, { active: "none", indicator: "risk" });

    expect(nav.map((item) => item.active)).toEqual([false, false, false]);
    expect(nav.map((item) => item.indicator)).toEqual(["risk", undefined, undefined]);
  });
});
