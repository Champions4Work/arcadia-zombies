import { expect, test, type Page } from "@playwright/test";

type E2eApi = {
  audioHeld: () => boolean;
  stageChest: () => void;
  stageOffer: () => void;
  stageOver: () => void;
};

async function boot(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?e2e=1");
  const skip = page.locator("#guide-skip");
  if (await skip.isVisible()) await skip.click();
  await page.locator("#go").click();
}

async function stage(page: Page, name: "stageChest" | "stageOffer" | "stageOver"): Promise<void> {
  await page.evaluate((key) => {
    const api = (globalThis as unknown as { __arcadiaE2e: E2eApi }).__arcadiaE2e;
    api[key]();
  }, name);
}

test("focuses CONTINUE, level-up cards, and end-screen buttons", async ({ page }) => {
  await boot(page);
  await stage(page, "stageChest");
  await expect(page.locator("#continue")).toBeVisible();
  await expect(page.locator("#continue")).toBeFocused();
  await page.keyboard.press("Enter");
  await stage(page, "stageOffer");
  await expect(page.locator("#offer-1")).toBeVisible();
  await expect(page.locator("#offer-1")).toBeFocused();
  await page.keyboard.press("2");
  await page.keyboard.press("Enter");
  await stage(page, "stageOver");
  await expect(page.locator("#go")).toBeVisible();
  await expect(page.locator("#go")).toBeFocused();
  await page.locator("#run-copy").focus();
  await expect(page.locator("#run-copy")).toBeFocused();
  await page.keyboard.press("Enter");
});

test("pauses music and SFX when the tab is hidden and resumes on return", async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("html")).toHaveAttribute("data-audio", "held");
  const held = await page.evaluate(() => {
    return (globalThis as unknown as { __arcadiaE2e: E2eApi }).__arcadiaE2e.audioHeld();
  });
  expect(held).toBe(true);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator("html")).toHaveAttribute("data-audio", "live");
});
