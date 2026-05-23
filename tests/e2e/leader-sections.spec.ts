import { expect, test } from "@playwright/test";
import { loginAsLeader } from "./support/auth";

const themes = ["light", "dark", "parchment"] as const;
const minimumTextContrast = 4.5;

function luminance(color: string) {
  const match = color.match(/rgba?\((\d+), (\d+), (\d+)/);
  if (!match) return null;

  const [red, green, blue] = match.slice(1, 4).map((value) => {
    const channel = Number(value) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);

  if (foregroundLuminance === null || backgroundLuminance === null) return null;

  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("leader page spacing", () => {
  test("keeps pastoral sections aligned with the current event section rhythm", async ({ page }) => {
    await loginAsLeader(page);
    await page.goto("/lider");

    await expect(page.getByRole("heading", { name: "Pedidos de apoio", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Rotina da célula", exact: true })).toBeVisible();

    const gaps = await page.evaluate(() => {
      function sectionGap(title: string) {
        const heading = Array.from(document.querySelectorAll("h2")).find((item) => item.textContent?.trim() === title);
        const section = heading?.closest("section");
        const previous = section?.previousElementSibling;

        if (!(section instanceof HTMLElement) || !(previous instanceof HTMLElement)) {
          return null;
        }

        const sectionBox = section.getBoundingClientRect();
        const previousBox = previous.getBoundingClientRect();

        return sectionBox.top - previousBox.bottom;
      }

      return {
        currentEvent: sectionGap("Rotina da célula"),
        supportRequests: sectionGap("Pedidos de apoio"),
      };
    });

    expect(gaps.supportRequests).not.toBeNull();
    expect(gaps.currentEvent).not.toBeNull();
    expect(gaps.supportRequests!).toBeLessThanOrEqual(32);
    expect(Math.abs(gaps.supportRequests! - gaps.currentEvent!)).toBeLessThanOrEqual(1);
  });

  for (const theme of themes) {
    test(`keeps primary action text readable in ${theme}`, async ({ page }) => {
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("koinonia-theme", selectedTheme);
      }, theme);

      await loginAsLeader(page);
      await page.goto("/lider");

      const action = page.getByRole("link", { name: /Registrar presença|Ver detalhes/ });
      await expect(action).toBeVisible();

      const styles = await action.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
        };
      });

      expect(contrastRatio(styles.color, styles.backgroundColor)).toBeGreaterThanOrEqual(minimumTextContrast);
    });
  }
});
