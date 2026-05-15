import { expect, test } from "@playwright/test";
import { loginAsLeader } from "./support/auth";
import { e2ePrisma } from "./support/db";
import { findLeaderEventCardTarget } from "./support/events-target";

const themes = ["light", "dark", "parchment"] as const;

test.describe("event cards", () => {
  test.afterAll(async () => {
    await e2ePrisma.$disconnect();
  });

  for (const theme of themes) {
    test(`render cleanly in ${theme}`, async ({ page }) => {
      const target = await findLeaderEventCardTarget();

      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("koinonia-theme", selectedTheme);
      }, theme);

      await loginAsLeader(page);
      await page.goto(target.path);

      await expect(page.getByRole("heading", { name: /Hist.rico de presen/i })).toBeVisible();

      const card = page.getByTestId("event-card").filter({ hasText: target.title }).first();
      await expect(card).toBeVisible();
      await expect(card.getByTestId("event-card-stats")).toBeVisible();
      await expect(card.getByText(target.expectedPresenceRate, { exact: true })).toBeVisible();
      await expect(card.getByTestId("event-card-action")).toContainText("Ver resumo");

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      const box = await card.boundingBox();
      const viewportWidth = page.viewportSize()?.width ?? 390;
      expect(box, "event card must be visible").not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth);
    });
  }
});
