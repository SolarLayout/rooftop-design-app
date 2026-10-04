import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { expectScreen } from "../screens";

// The pictures of Present, each against its baseline in e2e/baselines (present*.png: the present group's own,
// tools/check/e2e-groups.ts). After a change that is meant, look at the new picture beside the preview in
// docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test present-screens --update-snapshots   (in e2e/)

// Present with the demo from the API of the test stack: the tour is on once the result is there.
const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
// The day Present is opened on, fixed: the day's scene draws the sun of that day, so the picture does not move with the
// calendar. The same day as the report's (handover-screens.e2e.ts).
const DAY_OF_THE_REPORT = new Date("2026-10-03T09:00:00");

/**
 * Present at a scene of its tour (the board "Present"): the stage alone on the whole screen, the words at the bottom left
 * over the fade, the hint at the right. The page's clock is the test's: it runs until the tour is on and the ground's
 * imagery is drawn (the stage does not come up under a clock held from the start), then it is held and run forward tick
 * by tick to *scene* and *into* it. Under reduced motion each scene is cuts held for their time, so the picture stands still
 * whatever the tick the clock was held at. The phone has no Present.
 */
const presentAt = async (page: Page, scene: string, into: number) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: DAY_OF_THE_REPORT });
  await page.goto("/present");
  await expect(page.getByTestId("present")).toHaveAttribute("data-state", "touring", { timeout: RUN });
  await expect(page.getByTestId("present-modules")).toContainText("modules", { timeout: RUN });
  await expect(page.getByTestId("present-ground")).toHaveText("The ground is the satellite imagery", { timeout: RUN });
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
  const onTheRoof = page.getByRole("list", { name: "On the roof" });
  const STEP = 250;
  for (let run = 0; run < 60_000 && (await onTheRoof.getAttribute("data-scene")) !== scene; run += STEP) await page.clock.runFor(STEP);
  await expect(onTheRoof).toHaveAttribute("data-scene", scene);
  await page.clock.runFor(into);
};

// The day's scene at its middle cut: the roof whole under the sun of the day, as the board's screen draws the stage.
test("present", async ({ page }, testInfo) => {
  test.skip(isPhone(testInfo.project.name), "The phone has no Present.");
  test.setTimeout(RUN * 3);
  await presentAt(page, "day", 6_250);

  await expectScreen(page, "present");
});

// The last scene, the energy at its number (the board "Present", frame 6): the stage dimmed under the hero number and
// the chain's cascade, the strings lit by MPPT under it.
test("present, the energy", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), "The board draws the energy scene on desktop.");
  test.setTimeout(RUN * 3);
  await presentAt(page, "energy", 500);
  await expect(page.getByTestId("present-energy")).toHaveAttribute("data-state", "counted");

  await expectScreen(page, "present-energy");
});
