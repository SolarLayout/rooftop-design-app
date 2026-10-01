import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, inThePlan, sceneShown, stage, threeDView, withoutWebGL } from "../stage";

// The modules and the kept-clear areas of the scene (plan/phase-05-plan.md, steps 7 to 9, decision 21):
// what the stage draws is what /layout answered, for the three roof types; a press on a kept-clear area
// says why it is kept clear; without WebGL the plan of the design stands in.

const RUN = 90_000;

type Answered = { readouts: { positions: number }; layout: { n_rows: number; keepout: { obstacle: string | null; positions: number }[] } };

/** The answers of /layout as they come, newest last. */
function layoutsAnswered(page: Page): Answered[] {
  const answered: Answered[] = [];
  page.on("response", async (response) => {
    if (response.url().endsWith("/api/layout") && response.ok()) answered.push((await response.json()) as Answered);
  });
  return answered;
}

const modulesDrawn = (page: Page) => page.getByTestId("on-the-roof-modules");

/** The roof type chosen in the inspector that is shown for the size. */
async function chooseRoofType(page: Page, name: string) {
  await page.getByRole("radiogroup", { name: "Roof type" }).filter({ visible: true }).getByRole("radio", { name }).click();
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the modules", () => {
  test("the demo's positions are drawn as /layout answered them: 790 in 6 rows", async ({ page }) => {
    const answered = layoutsAnswered(page);
    await page.goto("/studio/array");
    await sceneShown(page);

    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });
    await expect.poll(() => answered.length).toBeGreaterThan(0);
    const last = answered[answered.length - 1];
    await expect(modulesDrawn(page)).toHaveText(`${last.readouts.positions} modules in ${last.layout.n_rows} rows`);
  });

  test("the three roof types render what /layout counts: east-west 940, sloped 1,068", async ({ page }) => {
    const answered = layoutsAnswered(page);
    await page.goto("/studio/roof");
    await sceneShown(page);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });

    await chooseRoofType(page, "East-west");
    await expect(modulesDrawn(page)).toContainText("940 modules", { timeout: RUN });
    await expect.poll(() => answered[answered.length - 1]?.readouts.positions).toBe(940);

    await chooseRoofType(page, "Sloped");
    await expect(modulesDrawn(page)).toContainText("1,068 modules", { timeout: RUN });
    await expect.poll(() => answered[answered.length - 1]?.readouts.positions).toBe(1068);
    await expect(modulesDrawn(page)).toHaveText(`1,068 modules in ${answered[answered.length - 1].layout.n_rows} rows`);
  });

  test("every kept-clear area is said with its count and what shades it", async ({ page }) => {
    await page.goto("/studio/array");
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });

    const parts = page.getByTestId("on-the-roof-keepout");
    await expect(parts).toHaveCount(7);
    await expect(parts.nth(0)).toHaveText("Kept clear · 12 positions: The parapet shades this area between 09:00 and 16:00");
    await expect(parts.nth(1)).toHaveText("Kept clear · 18 positions: Stair room shades this area between 09:00 and 16:00");
  });

  test("a press on a kept-clear area shows its callout; Escape closes it", async ({ page }) => {
    await page.goto("/studio/array");
    await sceneShown(page);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });
    const point = await inThePlan(page);
    // The stair room's kept-clear area lies north of it (5.0 by 4.0 at 22.5, 18.0), in the shade of December.
    const shade = point(22.5, 22.5);

    await page.mouse.click(shade.x, shade.y);

    const callout = page.getByTestId("stage-callout");
    await expect(callout).toBeVisible({ timeout: A_SCENE });
    await expect(callout).toContainText("Kept clear · 18 positions");
    await expect(callout).toContainText("Stair room shades this area between 09:00 and 16:00");

    await page.keyboard.press("Escape");
    await expect(callout).toHaveCount(0);
    await threeDView(page).click();
  });

  test("without WebGL the plan of the design stands in, with the modules on it", async ({ page }) => {
    await withoutWebGL(page);
    await page.goto("/studio/array");

    const plan = stage(page).getByTestId("plan-fallback");
    await expect(plan).toBeVisible({ timeout: RUN });
    await expect(plan.getByRole("status")).toHaveText("This browser cannot draw the roof in 3D.");
    await expect(plan.getByTestId("plan-module")).toHaveCount(790, { timeout: RUN });
    await expect(page.getByRole("img", { name: "Plan of the roof, north up" })).toBeVisible();
  });
});
