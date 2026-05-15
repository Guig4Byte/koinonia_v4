import { expect, type Page } from "@playwright/test";
import { leaderCredentials } from "./credentials";

export async function loginAsLeader(page: Page) {
  await page.goto("/login");
  await page.getByLabel(/e-mail/i).fill(leaderCredentials.email);
  await page.locator('input[name="password"]').fill(leaderCredentials.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/lider/);
}
