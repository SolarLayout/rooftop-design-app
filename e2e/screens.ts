import { expect, type Page } from "@playwright/test";

// The badge of `next dev` is not part of any screen.
const WITHOUT_THE_DEV_BADGE = "nextjs-portal { display: none !important; }";

/** A design run under load: what the pictures of a workspace wait for before they are taken. */
const RUN = 90_000;

/** The top bar's button with the project's name, which opens the project switcher. */
export const projectSwitcher = (page: Page) => page.getByRole("banner").getByRole("button", { name: /Pune demo roof/ });

/** The Design vitals region of the shell, where the run's numbers land. */
export const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });

/**
 * The top bar as it stands once the run is over, before a picture: the project's button is there, and on phone the top
 * bar says the notes to review only then. The picture is taken after that, not before.
 */
export async function topBarSettled(page: Page, projectName: string): Promise<void> {
  await expect(projectSwitcher(page)).toBeVisible({ timeout: RUN });
  if (projectName === "phone") await expect(page.getByRole("banner").getByRole("button", { name: "1 note to review" })).toBeVisible({ timeout: RUN });
}

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
