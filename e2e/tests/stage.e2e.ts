import { expect, test } from "../fixtures";
import { isNear, pixelOnce, sceneShown, stage, STAGE, withoutWebGL } from "../stage";

// The 3D stage of the Studio (plan/phase-05-plan.md, steps 1 to 4): the scene is drawn in the browser
// with software WebGL, on three sizes; its text equivalent names what is on the roof; without WebGL the
// stage says so. No request leaves the machine (e2e/fixtures.ts).

const RUN = 90_000;
const isDesktop = (projectName: string) => projectName === "desktop";

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the stage", () => {
  test("draws the demo's roof: the middle of the canvas is the roof, not the background", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    // The roof is the brightest thing on the stage; until the first frame is drawn the pixels are black.
    const isBright = ([red, green, blue]: [number, number, number]) => Math.min(red, green, blue) > 120;
    const pixel = await pixelOnce(page, 0.5, 0.5, isBright);
    expect(isBright(pixel), `the middle of the stage is ${pixel.join(", ")}`).toBe(true);
    expect(isNear(pixel, STAGE)).toBe(false);
    await expect(page.getByTestId("on-the-roof-roof")).toHaveText("Roof, 4 corners, 3,600 m², parapet 0.9 m", { timeout: RUN });
  });

  test("the title says the read-outs of the lens on desktop", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "the line under the title is of the desktop board");
    await page.goto("/studio/roof");
    await expect(page.getByTestId("stage-subline")).toHaveText("3,600 m² · 3,344 m² inside the setback · 6 obstacles", { timeout: RUN });

    await page.getByRole("link", { name: "Array" }).click();
    await expect(page.getByTestId("stage-subline")).toHaveText("790 positions · 28 tables · 6 rows · 2,038 m² of modules", { timeout: RUN });
  });

  test("without WebGL the stage says so and the Studio still works", async ({ page }) => {
    await withoutWebGL(page);
    await page.goto("/studio/roof");

    await expect(stage(page)).toHaveAttribute("data-state", "plan", { timeout: RUN });
    await expect(stage(page).getByRole("status")).toHaveText("This browser cannot draw the roof in 3D.");
    await expect(stage(page).locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });
  });
});
