import { expect, type Page } from "@playwright/test";

// The badge of `next dev` is not part of any screen.
const WITHOUT_THE_DEV_BADGE = "nextjs-portal { display: none !important; }";

/** Compares the whole page with its baseline in e2e/baselines, once the fonts are there. */
export async function expectScreen(page: Page, name: string): Promise<void> {
  await page.addStyleTag({ content: WITHOUT_THE_DEV_BADGE });
  await page.evaluate(() => document.fonts.ready);
  // Two pictures in a row must agree before one is compared: under load the page takes longer to stand still.
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true, timeout: 20_000 });
}
