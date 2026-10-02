import type { Page, TestInfo } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, inThePlan, obstacleSelectedOnStage, sceneSettled, sceneShown, type PlanFrame } from "../stage";

// Selection by raycast (plan/phase-05-plan.md, step 17, decision 10): a press on a module, on the roof, on
// an obstacle or on a kept-clear area selects it, and the callout and the text equivalent say so; a press
// on the ground clears; hover is for the eye alone. In the plan view the roof's metres map to pixels in a
// straight line (e2e/stage.ts, inThePlan).

const RUN = 90_000;

const callout = (page: Page) => page.getByTestId("stage-callout");
const modulesDrawn = (page: Page) => page.getByTestId("on-the-roof-modules");
const roofDrawn = (page: Page) => page.getByTestId("on-the-roof-roof");

/** A press at a point of the page: a tap where the device has touch, a click of the mouse otherwise. */
async function press(page: Page, testInfo: TestInfo, at: { x: number; y: number }) {
  if (testInfo.project.use.hasTouch) await page.touchscreen.tap(at.x, at.y);
  else await page.mouse.click(at.x, at.y);
}

/** The Roof lens with the demo's modules drawn, seen in the plan. */
async function planOfTheDemo(page: Page): Promise<PlanFrame> {
  await page.goto("/studio/roof");
  await sceneShown(page);
  await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows", { timeout: RUN });
  return inThePlan(page);
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("a press on the roof", () => {
  test("on a module selects its position: the callout says which and in what row, the text equivalent says so; on the ground clears", async ({ page }, testInfo) => {
    const point = await planOfTheDemo(page);

    // The first row stands along the south edge; its modules face south at the demo's tilt.
    await press(page, testInfo, point(45, 2.1));

    await expect(callout(page)).toBeVisible({ timeout: A_SCENE });
    await expect(callout(page)).toContainText(/^Position \d+/);
    await expect(callout(page)).toContainText("Row 1 · 15° to the south");
    const position = (await callout(page).innerText()).match(/Position (\d+)/)?.[1];
    await expect(modulesDrawn(page)).toHaveText(`790 modules in 6 rows, position ${position} selected`);
    await expect(page.getByTestId("obstacle-card")).toHaveCount(0);

    await press(page, testInfo, point(-10, 20));

    await expect(callout(page)).toHaveCount(0);
    await expect(modulesDrawn(page)).toHaveText("790 modules in 6 rows");
  });

  test("on the roof surface, between two rows, selects the roof: its size and its area", async ({ page }, testInfo) => {
    const point = await planOfTheDemo(page);

    await press(page, testInfo, point(45, 6.4));

    await expect(callout(page)).toBeVisible({ timeout: A_SCENE });
    await expect(callout(page)).toContainText("Roof · selected");
    await expect(callout(page)).toContainText("90.0 × 40.0 m · 3,600 m²");
    await expect(roofDrawn(page)).toHaveText("Roof, 4 corners, 3,600 m², parapet 0.9 m, selected");

    await page.keyboard.press("Escape");

    await expect(callout(page)).toHaveCount(0);
    await expect(roofDrawn(page)).toHaveText("Roof, 4 corners, 3,600 m², parapet 0.9 m");
  });

  test("on an obstacle selects it in the scene and in the list: its card opens", async ({ page }, testInfo) => {
    const point = await planOfTheDemo(page);

    await press(page, testInfo, point(22.5, 18));

    await obstacleSelectedOnStage(page, "Stair room", testInfo.project.name === "phone");
    await expect(page.getByTestId("obstacle-card").getByRole("textbox", { name: "Name" })).toHaveValue("Stair room");
    await expect(page.getByTestId("on-the-roof-obstacle").filter({ hasText: "Stair room" })).toContainText(", selected");
  });

  test("hover changes nothing but the cursor: the text equivalent and the callout stay as they are", async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.hasTouch), "hover is of pointer devices");
    const point = await planOfTheDemo(page);
    await sceneSettled(page);
    const onTheRoof = page.getByRole("list", { name: "On the roof" });
    const before = await onTheRoof.textContent();

    const stairRoom = point(22.5, 18);
    await page.mouse.move(stairRoom.x, stairRoom.y);

    await expect
      .poll(() => page.evaluate(([x, y]) => getComputedStyle(document.elementFromPoint(x, y)!).cursor, [stairRoom.x, stairRoom.y] as const), { timeout: A_SCENE })
      .toBe("pointer");
    await expect(callout(page)).toHaveCount(0);
    expect(await onTheRoof.textContent()).toBe(before);

    const off = point(-10, 20);
    await page.mouse.move(off.x, off.y);

    await expect.poll(() => page.evaluate(([x, y]) => getComputedStyle(document.elementFromPoint(x, y)!).cursor, [off.x, off.y] as const), { timeout: A_SCENE }).toBe("auto");
  });
});
