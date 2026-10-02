import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { pixelsAt, sceneSettled, stage, type Share } from "../stage";

// The time on the stage (plan/phase-06-plan.md, steps 1 to 5; the boards "Time on the stage" and "Studio,
// Sun lens"): the day's sun asked once, the light following the time as the timeline is dragged, played or
// keyed, the modules never rebuilt by it (the counter of development); the pill of every lens; the day. On
// three sizes; on phone the timeline is in the sheet.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

const readOut = (page: Page) => page.getByTestId("on-the-roof-sun");
const timeline = (page: Page) => page.getByTestId("sun-timeline").filter({ visible: true });
const timeSlider = (page: Page) => timeline(page).getByRole("slider", { name: "Time of day" });
const moduleWrites = async (page: Page) => Number(await stage(page).getAttribute("data-module-writes"));

/** Counts the requests of /sun from now on. */
function sunRequests(page: Page): { count: () => number; days: () => unknown[] } {
  const days: unknown[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/sun")) days.push((request.postDataJSON() as { day: unknown }).day);
  });
  return { count: () => days.length, days: () => days };
}

/**
 * The Sun lens on the demo, its scene drawn with the day's sun. On phone the sheet stands at half, with the
 * timeline at its top and the stage over it, as the board has it; for the inspector it is opened to its full stop.
 */
async function sunLensOpened(page: Page, projectName: string, sheet: "half" | "full" = "half") {
  await page.goto("/studio/sun");
  await sceneSettled(page);
  await expect(readOut(page)).toHaveText("21 Dec, 10:30 solar time, sun 42.6° high, 28.5° E of south", { timeout: RUN });
  if (isPhone(projectName) && sheet === "full") {
    await page.getByRole("separator", { name: "Inspector" }).focus();
    await page.keyboard.press("End");
    await expect(page.getByRole("separator", { name: "Inspector" })).toHaveAttribute("aria-valuetext", "Open");
  }
  await expect(timeSlider(page)).toBeVisible({ timeout: RUN });
}

/** A drag of a slider's handle along its whole track to an end, in steps, released there. */
async function draggedAlong(page: Page, slider: Locator, toShare: number) {
  const rail = (await slider.locator("xpath=..").boundingBox())!;
  const from = (await slider.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(rail.x + rail.width * toShare, from.y + from.height / 2, { steps: 20 });
  await page.mouse.up();
}

// Places in the middle band of the canvas, where the roof and its shadows are.
const BAND: Share[] = [0.35, 0.45, 0.55].flatMap((y) => [0.3, 0.4, 0.5, 0.6, 0.7].map((x): Share => [x, y]));

// A describe's own timeout does not reach every test (Phase 5, "Found on the way"): each test sets it.
test.beforeEach(() => test.setTimeout(RUN + 30_000));

test.describe("the time on the stage", () => {
  test("a drag of the timeline moves the light and the read-out, asks nothing of /sun and rebuilds no module", async ({ page }, testInfo) => {
    const suns = sunRequests(page);
    await sunLensOpened(page, testInfo.project.name);
    const asked = suns.count();
    const writes = await moduleWrites(page);
    const before = await pixelsAt(page, BAND);

    await draggedAlong(page, timeSlider(page), 1);

    await expect(timeSlider(page)).toHaveAttribute("aria-valuetext", "17:15 solar time");
    await expect(readOut(page)).toHaveText("21 Dec, 17:15 solar time, sun 2.5° high, 64.2° W of south");
    await expect.poll(async () => JSON.stringify(await pixelsAt(page, BAND)), { timeout: RUN }).not.toBe(JSON.stringify(before));
    expect(suns.count()).toBe(asked);
    expect(await moduleWrites(page)).toBe(writes);
    expect(writes).toBeGreaterThan(0);
  });

  test("play moves the time a quarter hour at a step and Pause stops it; the modules are not rebuilt", async ({ page }, testInfo) => {
    await sunLensOpened(page, testInfo.project.name);
    const writes = await moduleWrites(page);

    await timeline(page).getByRole("button", { name: "Play the day" }).click();
    await expect(readOut(page)).toContainText("11:", { timeout: RUN });
    await timeline(page).getByRole("button", { name: "Pause" }).click();
    const stopped = await readOut(page).textContent();
    await page.waitForTimeout(800);

    await expect(readOut(page)).toHaveText(stopped!);
    expect(await moduleWrites(page)).toBe(writes);
  });

  test("under reduced motion play moves by whole hours", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "the same code on every size");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await sunLensOpened(page, testInfo.project.name);

    await timeline(page).getByRole("button", { name: "Play the day" }).click();
    await expect(readOut(page)).toContainText("11:30 solar time", { timeout: RUN });
    await timeline(page).getByRole("button", { name: "Pause" }).click();

    await expect(readOut(page)).toContainText(/(11|12|13):30 solar time/);
  });

  test("the keys , . move an hour and [ ] a day in every lens, and not while a field has the focus", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "keys are of the keyboard");
    const suns = sunRequests(page);
    await page.goto("/studio/array");
    await sceneSettled(page);
    await expect(readOut(page)).toContainText("10:30 solar time", { timeout: RUN });

    await page.keyboard.press(".");
    await expect(readOut(page)).toContainText("21 Dec, 11:30 solar time");
    await page.keyboard.press(",");
    await page.keyboard.press(",");
    await expect(readOut(page)).toContainText("21 Dec, 09:30 solar time");
    await page.keyboard.press("]");
    await expect(readOut(page)).toContainText("22 Dec, 09:30 solar time", { timeout: RUN });
    expect(suns.days()).toContain(356);

    await page.getByRole("textbox", { name: "Lower-edge clearance" }).filter({ visible: true }).focus();
    await page.keyboard.press(".");
    await expect(readOut(page)).toContainText("22 Dec, 09:30 solar time");
  });

  test("a day chosen asks /sun for it; Any date opens the day and the month", async ({ page }, testInfo) => {
    const suns = sunRequests(page);
    await sunLensOpened(page, testInfo.project.name, "full");
    const inspector = page.getByRole("region", { name: "Day" });

    await inspector.getByRole("radio", { name: "21 Jun" }).click();
    await expect.poll(() => suns.days(), { timeout: RUN }).toContain(172);
    await expect(readOut(page)).toContainText("21 Jun, 10:30 solar time", { timeout: RUN });

    await inspector.getByRole("radio", { name: "Any date" }).click();
    await inspector.getByRole("textbox", { name: "Day" }).fill("4");
    await inspector.getByRole("textbox", { name: "Day" }).press("Enter");
    await expect(readOut(page)).toContainText("4 Jun, 10:30 solar time", { timeout: RUN });
    await expect(inspector).toContainText("Day 155 · the design day is 21 December");

    await inspector.getByRole("radio", { name: "21 Dec" }).click();
    await expect(readOut(page)).toContainText("21 Dec, 10:30 solar time", { timeout: RUN });
    await expect(inspector).toContainText("21 December is the design day: the winter solstice for this hemisphere");
  });

  test("the Sun lens says where the sun stands at the time", async ({ page }, testInfo) => {
    await sunLensOpened(page, testInfo.project.name, "full");
    const sunAt = page.getByRole("region", { name: "Sun at 10:30" });

    await expect(sunAt).toContainText("Height42.6 °");
    await expect(sunAt).toContainText("Bearing28.5 ° E of south");
  });

  test("the pill of the Array lens says the day and the time and plays it", async ({ page }, testInfo) => {
    await page.goto("/studio/array");
    await sceneSettled(page);
    const pill = page.getByTestId("time-pill");
    await expect(pill).toContainText("21 Dec · 10:30", { timeout: RUN });

    if (isPhone(testInfo.project.name)) await pill.click();
    else await pill.getByRole("button", { name: "Play the day" }).click();
    await expect(readOut(page)).toContainText("10:45 solar time", { timeout: RUN });
    if (isPhone(testInfo.project.name)) await pill.click();
    else await pill.getByRole("button", { name: "Pause" }).click();
    await expect(pill).not.toContainText("10:30");
  });

  test("the time on the stage and the Sun lens: axe finds nothing serious or critical", async ({ page }, testInfo) => {
    await sunLensOpened(page, testInfo.project.name);
    const found = await new AxeBuilder({ page }).analyze();
    const serious = found.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
