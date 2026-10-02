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

/**
 * The whole page with what its workspace scrolls laid out in full, from the top: on tablet the Studio scrolls inside
 * its frame, so that its stage and the end of its inspector are never in one window. The window grows by what
 * scrolls for the picture, and is given back after.
 */
export async function expectWholeScreen(page: Page, name: string): Promise<void> {
  const size = page.viewportSize();
  const more = await page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>("[data-workspace-frame]");
    if (!frame) return 0;
    frame.scrollTop = 0;
    return frame.scrollHeight - frame.clientHeight;
  });
  if (!size || more <= 0) return expectScreen(page, name);
  await page.setViewportSize({ width: size.width, height: size.height + more });
  try {
    await expectScreen(page, name);
  } finally {
    await page.setViewportSize(size);
  }
}
