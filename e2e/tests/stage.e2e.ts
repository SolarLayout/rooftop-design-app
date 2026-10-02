import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, fit, inThePlan, isBright, isDrawn, isNear, north, pixelOnce, pixelsAt, planView, sceneCanvas, sceneSettled, sceneShown, stage, STAGE, threeDView, withoutWebGL, type Pixel, type Share } from "../stage";

// The 3D stage of the Studio (plan/phase-05-plan.md, steps 1 to 4): the scene is drawn in the browser
// with software WebGL, on three sizes; its text equivalent names what is on the roof; without WebGL the
// stage says so; the view controls and the labels of the roof's edges stand over it. No request leaves
// the machine (e2e/fixtures.ts).

const RUN = 90_000;

/** The palette's roof and module glass (`roof` #D3D6DB, `moduleGlass` #16294D). */
const ROOF: Pixel = [211, 214, 219];
const GLASS: Pixel = [22, 41, 77];
const isDesktop = (projectName: string) => projectName === "desktop";
const isPhone = (projectName: string) => projectName === "phone";


// Places in the middle band of the canvas, under no control and no label, where the two views differ.
const BAND: Share[] = [0.35, 0.5, 0.65].flatMap((y) => [0.2, 0.35, 0.5, 0.65, 0.8].map((x): Share => [x, y]));

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the stage", () => {
  test("draws the demo's roof: the middle of the canvas is the roof with its modules, not the background", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    const pixel = await pixelOnce(page, 0.5, 0.5, isDrawn);
    expect(isDrawn(pixel), `the middle of the stage is ${pixel.join(", ")}`).toBe(true);
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

  // The light is held to the palette (docs/design/design-tokens.md, "3D scene palette"): the boards draw every
  // surface at its colour. In the plan, straight down, at 10:30 on the design day, the morning the light is held
  // to: a lit roof, and the glass of a module, which faces the sun a little more than the roof does.
  test("a lit roof and a module's glass are of their palette colours, as the boards draw them", async ({ page }) => {
    const laidOut = page.waitForResponse((response) => response.url().endsWith("/api/layout"), { timeout: A_SCENE });
    // In the Sun lens, which draws no kept-clear areas over the roof.
    await page.goto("/studio/sun");
    const { layout } = (await (await laidOut).json()) as { layout: { modules: { row: number; outline: [number, number][] }[] } };
    await sceneSettled(page);
    const point = await inThePlan(page);
    const box = (await sceneCanvas(page).boundingBox())!;
    const shareOf = ([east, north]: readonly [number, number]): Share => {
      const at = point(east, north);
      return [(at.x - box.x) / box.width, (at.y - box.y) / box.height];
    };
    // A module of the first row 30 m east, clear of the chips of the edges; and the roof the stair room keeps clear
    // north-east of it, lit at 10:30, when its shadow falls north-north-west: metres of it, also on phone.
    const middleOf = (outline: [number, number][]) => outline.reduce(([x, y], [px, py]) => [x + px / outline.length, y + py / outline.length], [0, 0]) as [number, number];
    const glassAt = layout.modules
      .filter((module) => module.row === 0)
      .map((module) => middleOf(module.outline))
      .sort((a, b) => Math.abs(a[0] - 30) - Math.abs(b[0] - 30))[0];

    const [roof, glass] = await pixelsAt(page, [shareOf([28.5, 22.5]), shareOf(glassAt)]);

    const said = `the lit roof is ${roof.join(", ")} (its palette 211, 214, 219), a module's glass ${glass.join(", ")} (22, 41, 77)`;
    expect(isNear(roof, ROOF, 14) && isNear(glass, GLASS, 14), said).toBe(true);
  });

  test("the labels along the roof's edges say the length of each: two of 90.0 m, two of 40.0 m", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    await expect(stage(page).getByText("90.0 m")).toHaveCount(2, { timeout: A_SCENE });
    await expect(stage(page).getByText("40.0 m")).toHaveCount(2);
    await expect(stage(page).getByTestId("stage-label").first()).toBeVisible();
  });

  test("Plan changes the picture: the roof lies in the middle, north up, the ground above it", async ({ page }) => {
    await page.goto("/studio/roof");
    await sceneShown(page);
    await pixelOnce(page, 0.5, 0.5, isDrawn);
    const in3D = await pixelsAt(page, BAND);
    await expect(planView(page)).toHaveAttribute("aria-checked", "false");

    await planView(page).click();

    await expect(planView(page)).toHaveAttribute("aria-checked", "true");
    await expect
      .poll(async () => (await pixelsAt(page, BAND)).some((pixel, index) => !isNear(pixel, in3D[index])), { timeout: A_SCENE })
      .toBe(true);
    const middle = await pixelOnce(page, 0.5, 0.5, isDrawn);
    expect(isDrawn(middle), `the middle of the plan is ${middle.join(", ")}`).toBe(true);
    const [above] = await pixelsAt(page, [[0.5, 0.08]]);
    expect(isBright(above), `above the roof in the plan is ${above.join(", ")}`).toBe(false);

    await threeDView(page).click();
    await expect(threeDView(page)).toHaveAttribute("aria-checked", "true");
  });

  test("the north control says where the view looks; a drag turns it; pressing it turns north up", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "the phone board has 3D and Plan alone");
    await page.goto("/studio/roof");
    await sceneShown(page);
    // The 3D view looks north-east from the south-west.
    await expect(north(page)).toHaveAccessibleName("North: the view looks 46° east of north", { timeout: A_SCENE });

    const box = await sceneCanvas(page).boundingBox();
    if (!box) throw new Error("The canvas has no box.");
    const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 160, y, { steps: 8 });
    await page.mouse.up();

    await expect(north(page)).not.toHaveAccessibleName("North: the view looks 46° east of north", { timeout: A_SCENE });

    await north(page).click();

    await expect(north(page)).toHaveAccessibleName("North: the view looks north", { timeout: A_SCENE });
  });

  test("the keyboard reaches every control: 3D, then Plan by the arrow, Fit, North", async ({ page }, testInfo) => {
    await page.goto("/studio/roof");
    await sceneShown(page);

    await threeDView(page).focus();
    await expect(threeDView(page)).toBeFocused();
    await page.keyboard.press("ArrowRight");
    await expect(planView(page)).toBeFocused();
    await expect(planView(page)).toHaveAttribute("aria-checked", "true");

    if (isPhone(testInfo.project.name)) {
      await expect(fit(page)).toHaveCount(0);
      await expect(north(page)).toHaveCount(0);
      return;
    }
    await page.keyboard.press("Tab");
    await expect(fit(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(north(page)).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("ArrowLeft");
    await expect(threeDView(page)).toHaveAttribute("aria-checked", "true");
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
