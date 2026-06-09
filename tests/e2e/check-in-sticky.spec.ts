import { expect, type Locator, test } from "@playwright/test";
import { loginAsLeader } from "./support/auth";
import { findLeaderCheckInAdjustmentTarget } from "./support/check-in-target";
import { e2ePrisma } from "./support/db";

const themes = ["light", "dark", "parchment"] as const;

async function expectNoOverlap(target: Locator, overlay: Locator) {
  const [targetBox, overlayBox] = await Promise.all([
    target.boundingBox(),
    overlay.boundingBox(),
  ]);

  expect(targetBox, "target element must be visible").not.toBeNull();
  expect(overlayBox, "overlay element must be visible").not.toBeNull();

  const targetRect = targetBox!;
  const overlayRect = overlayBox!;
  const overlaps = !(
    targetRect.x + targetRect.width <= overlayRect.x ||
    overlayRect.x + overlayRect.width <= targetRect.x ||
    targetRect.y + targetRect.height <= overlayRect.y ||
    overlayRect.y + overlayRect.height <= targetRect.y
  );

  expect(overlaps, "fixed save bar must not cover the checked element").toBe(false);
}

async function expectVerticalGapAtMost(upper: Locator, lower: Locator, maxGap: number) {
  const [upperBox, lowerBox] = await Promise.all([
    upper.boundingBox(),
    lower.boundingBox(),
  ]);

  expect(upperBox, "upper element must be visible").not.toBeNull();
  expect(lowerBox, "lower element must be visible").not.toBeNull();

  const gap = lowerBox!.y - (upperBox!.y + upperBox!.height);
  expect(gap).toBeGreaterThanOrEqual(0);
  expect(gap).toBeLessThanOrEqual(maxGap);
}

async function expectFixedToViewport(locator: Locator, scrollTo: number) {
  const before = await locator.boundingBox();
  expect(before, "fixed element must be visible before scrolling").not.toBeNull();

  await locator.page().evaluate((scrollTop) => window.scrollTo(0, scrollTop), scrollTo);

  const after = await locator.boundingBox();
  expect(after, "fixed element must be visible after scrolling").not.toBeNull();
  expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1);
}

test.describe("check-in fixed save bar", () => {
  test.afterAll(async () => {
    await e2ePrisma.$disconnect();
  });

  for (const theme of themes) {
    test(`does not cover check-in content in ${theme}`, async ({ page }) => {
      const target = await findLeaderCheckInAdjustmentTarget();

      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("koinonia-theme", selectedTheme);
      }, theme);

      await loginAsLeader(page);
      await page.goto(target.path);

      await expect(page.getByRole("heading", { name: /Ajustar presen/ })).toBeVisible();
      await expect(page.locator('nav[aria-label*="principal"]')).toHaveCount(0);

      const saveBar = page.getByTestId("check-in-save-bar");
      const presenceRate = page.getByTestId("check-in-presence-rate");
      await expect(saveBar).toContainText(/Sem alterações|Pronto para atualizar|Pronto para salvar/);
      await expect(saveBar.getByRole("link", { name: "Cancelar" })).toBeVisible();
      await expect(saveBar.getByRole("button", { name: "Salvar ajuste" })).toBeVisible();
      await expect(presenceRate).toHaveText(target.expectedPresenceRate);
      await expectNoOverlap(presenceRate, saveBar);
      await expectFixedToViewport(saveBar, 240);

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const lastMemberCard = page.getByTestId("check-in-member-card").last();
      await expect(lastMemberCard).toBeVisible();
      await expectNoOverlap(lastMemberCard, saveBar);
      await expectVerticalGapAtMost(lastMemberCard, saveBar, 24);
    });
  }
});
