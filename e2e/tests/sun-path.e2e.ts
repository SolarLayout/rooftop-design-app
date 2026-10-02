import type { Locator, Page, TestInfo } from "@playwright/test";
import { expect, test } from "../fixtures";
import { A_SCENE, inThePlan, sceneSettled, switchLens } from "../stage";

// The sun path on the stage (plan/phase-06-plan.md, step 8 and decision 10; the boards "Studio, Sun lens"
// and "Sun path and shadow outlines"): the day's arc in the Sun lens alone, said by the text equivalent; the
// marker at the view's hour, following the timeline; the hour marks and the marker's callout on tablet and
// desktop, the callout of what is selected winning over it. On three sizes.

const RUN = 90_000;
const isPhone = (testInfo: TestInfo) => testInfo.project.name === "phone";

const pathLine = (page: Page) => page.getByTestId("on-the-roof-sun-path");
const marker = (page: Page) => page.getByTestId("sun-marker");
const sunCallout = (page: Page) => page.getByTestId("sun-callout");
const hourChips = (page: Page) => page.getByTestId("sun-hour");
const timeSlider = (page: Page) => page.getByTestId("sun-timeline").filter({ visible: true }).getByRole("slider", { name: "Time of day" });

const THE_PATH = "Sun path of 21 Dec from 06:33 to 17:27, the shade-free window from 09:00 to 16:00 thicker";

/** The Sun lens on the demo, its scene drawn with the day's sun at 10:30, as the view opens. */
async function sunLensOpened(page: Page) {
  await page.goto("/studio/sun");
  await sceneSettled(page);
  await expect(page.getByTestId("on-the-roof-sun")).toHaveText("21 Dec, 10:30 solar time, sun 42.6° high, 28.5° E of south", { timeout: RUN });
}

/** The middle of what a locator shows, on the page. */
async function middleOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("It is not on the page.");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** The timeline's time set by its keys: to the day's last quarter hour, then back by quarters. */
async function timeSetBack(page: Page, quarters: number) {
  await timeSlider(page).focus();
  await page.keyboard.press("End");
  for (let step = 0; step < quarters; step += 1) await page.keyboard.press("ArrowLeft");
}

// A describe's own timeout does not reach every test (Phase 5, "Found on the way"): each test sets it.
test.beforeEach(() => test.setTimeout(RUN + 30_000));

test.describe("the sun path", () => {
  test("is drawn in the Sun lens, as the text equivalent says, and in no other lens", async ({ page }) => {
    await sunLensOpened(page);

    await expect(pathLine(page)).toHaveText(THE_PATH, { timeout: A_SCENE });
    await expect(marker(page)).toBeVisible({ timeout: A_SCENE });

    await switchLens(page, "Array");

    await expect(pathLine(page)).toHaveCount(0);
    await expect(marker(page)).toHaveCount(0);
    await expect(hourChips(page)).toHaveCount(0);
  });

  test("the marker's callout says the time and the sun; the hour marks say sunrise, the window, noon and sunset; none of them on phone", async ({ page }, testInfo) => {
    await sunLensOpened(page);
    await expect(marker(page)).toBeVisible({ timeout: A_SCENE });

    if (isPhone(testInfo)) {
      await expect(sunCallout(page)).toBeHidden();
      for (const chip of await hourChips(page).all()) await expect(chip).toBeHidden();
      return;
    }
    await expect(sunCallout(page)).toBeVisible();
    await expect(sunCallout(page).locator("span").first()).toHaveText("10:30");
    await expect(sunCallout(page)).toContainText("Sun 42.6° high, 28.5° E of south");
    await expect.poll(() => hourChips(page).allTextContents(), { timeout: A_SCENE }).toEqual(["06:33 sunrise", "09:00", "12:00", "16:00", "sunset 17:27"]);
  });

  test("the marker follows the time moved on the timeline; at the window's end its callout says so and the mark of 16:00 gives way", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "on phone the timeline is in the sheet, and the marker has neither callout nor marks");
    await sunLensOpened(page);
    await expect(marker(page)).toBeVisible({ timeout: A_SCENE });
    const before = await middleOf(marker(page));

    // From 17:15, five quarter hours back: 16:00.
    await timeSetBack(page, 5);

    await expect(timeSlider(page)).toHaveAttribute("aria-valuetext", "16:00 solar time");
    await expect(sunCallout(page)).toContainText("16:00 · end of the shade-free window");
    await expect(sunCallout(page)).toContainText("Sun 18.0° high, 56.6° W of south");
    await expect.poll(() => hourChips(page).allTextContents(), { timeout: A_SCENE }).toEqual(["06:33 sunrise", "09:00", "12:00", "sunset 17:27"]);
    const after = await middleOf(marker(page));
    // The sun went from the south-east to the south-west: the marker moved across the stage.
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(50);
  });

  test("the callout of what is selected wins: while the roof is selected the marker has none", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo), "on phone the marker has no callout");
    await sunLensOpened(page);
    const point = await inThePlan(page);
    await expect(sunCallout(page)).toHaveCount(1, { timeout: A_SCENE });

    // On the roof surface between two rows (e2e/tests/selection.e2e.ts).
    const between = point(45, 6.4);
    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(between.x, between.y);
    else await page.mouse.click(between.x, between.y);

    await expect(page.getByTestId("stage-callout")).toContainText("Roof · selected", { timeout: A_SCENE });
    await expect(sunCallout(page)).toHaveCount(0);

    await page.keyboard.press("Escape");

    await expect(page.getByTestId("stage-callout")).toHaveCount(0);
    await expect(sunCallout(page)).toHaveCount(1);
  });
});
