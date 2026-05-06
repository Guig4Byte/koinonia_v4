import { describe, expect, it } from "vitest";
import { UserRole } from "../../generated/prisma/client";
import { appNavForRole, homeHrefForRole, secondaryNavForRole } from "./app-nav";

describe("app navigation", () => {
  it("maps the home route for each role", () => {
    expect(homeHrefForRole(UserRole.LEADER)).toBe("/lider");
    expect(homeHrefForRole(UserRole.SUPERVISOR)).toBe("/supervisor");
    expect(homeHrefForRole(UserRole.PASTOR)).toBe("/pastor");
    expect(homeHrefForRole(UserRole.ADMIN)).toBe("/pastor");
  });

  it("maps the secondary section for each role", () => {
    expect(secondaryNavForRole(UserRole.LEADER)).toMatchObject({ href: "/pessoas", label: "Membros" });
    expect(secondaryNavForRole(UserRole.SUPERVISOR)).toMatchObject({ href: "/celulas", label: "Células" });
    expect(secondaryNavForRole(UserRole.PASTOR)).toMatchObject({ href: "/equipe", label: "Equipe" });
    expect(secondaryNavForRole(UserRole.ADMIN)).toMatchObject({ href: "/equipe", label: "Equipe" });
  });

  it("marks only the selected tab as active and receives the indicator", () => {
    const nav = appNavForRole(UserRole.LEADER, { active: "secondary", indicator: "attention" });

    expect(nav.map((item) => item.label)).toEqual(["Visão", "Membros", "Encontros"]);
    expect(nav.map((item) => item.active)).toEqual([false, true, false]);
    expect(nav.map((item) => item.indicator)).toEqual([undefined, "attention", undefined]);
  });
});
