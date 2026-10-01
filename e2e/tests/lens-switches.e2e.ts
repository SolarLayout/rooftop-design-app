import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { isDrawn, pixelOnce, sceneShown, stage } from "../stage";

// Twenty lens switches in a row leave the canvas drawing (plan/phase-05-plan.md, step 20): the stage goes
// through Roof, Array, Sun and Strings five times, and at the end still draws the roof, with no state of a
// context lost. The frame rate is looked at by hand, not here.

const RUN = 90_000;

/** The lens links of the size: the rail on desktop, the row on tablet, the switch in the sheet on phone. */
const lensLink = (page: Page, name: string) => page.getByRole("navigation", { name: "Lenses" }).filter({ visible: true }).getByRole("link", { name, exact: true });

test.describe.configure({ timeout: RUN + 120_000 });

test("twenty lens switches leave the stage drawing the roof", async ({ page }) => {
  await page.goto("/studio/roof");
  await sceneShown(page);

  for (let round = 0; round < 5; round += 1) {
    for (const lens of ["Array", "Sun", "Strings", "Roof"]) {
      await lensLink(page, lens).click();
      await expect(page).toHaveURL(new RegExp(`/studio/${lens.toLowerCase()}$`));
      await expect(stage(page)).toHaveAttribute("data-state", "scene");
    }
  }

  await sceneShown(page);
  await expect(stage(page).getByRole("status")).toHaveCount(0);
  const pixel = await pixelOnce(page, 0.5, 0.5, isDrawn);
  expect(isDrawn(pixel), `the middle of the stage is ${pixel.join(", ")}`).toBe(true);
  await expect(page.getByTestId("on-the-roof-roof")).toContainText("Roof, 4 corners");
});
