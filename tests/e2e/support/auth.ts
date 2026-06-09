import { type Page } from "@playwright/test";
import { leaderCredentials } from "./credentials";

export async function loginAsLeader(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/e-mail/i).fill(leaderCredentials.email);
  await page.locator('input[name="password"]').fill(leaderCredentials.password);
  await Promise.all([
    page.waitForURL(/\/lider(?:\?|$)/, { timeout: 15_000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ]);
}
