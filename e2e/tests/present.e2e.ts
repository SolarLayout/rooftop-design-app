import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { pixelsAt, sceneCanvas, stage, type Pixel, type Share } from "../stage";

// Present (plan/phase-10-plan.md, steps 18 to 21, decisions 8 to 11; the board "Present"): the Studio's stage on the whole
// screen without the shell's chrome, the tour of six scenes on the app's clock, looping; any key or touch returns to the
// Studio's last lens; reduced motion as cuts; nothing asked of the API; the frame budget. On desktop and tablet: the
// phone has no Present. The page's clock is installed and run forward scene by scene, so that a test is not 40 s of
// waiting: every timer and animation frame of the page fires as the clock is run, and the stage stands still between.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

const OPENED = new Date("2026-10-03T09:00:00");
const READY = new Date("2026-10-03T09:00:01");

/** The scenes in their order, with their words and their lengths (lib/present/tour.ts, decision 9). */
const SCENES = [
  { words: "The satellite from above tilts into 3D", duration: 4000 },
  { words: "The building and the obstacles rise", duration: 4000 },
  { words: "The modules fill row by row", duration: 6000 },
  { words: "The day plays with its shadows", duration: 12000 },
  { words: "The strings light up by MPPT", duration: 4000 },
  { words: "The energy counts up", duration: 10000 },
] as const;
const FACTS = "Pune demo roof · 357.28 kWp · 617.8 MWh a year";
const HINT = "Press any key or touch the screen to return";

const present = (page: Page) => page.getByTestId("present");
const words = (page: Page) => page.getByTestId("present-words");
const sceneWords = (page: Page) => page.getByTestId("present-scene");
const hint = (page: Page) => page.getByTestId("present-hint");
const modulesSaid = (page: Page) => page.getByTestId("present-modules");
const sunSaid = (page: Page) => page.getByTestId("present-sun");
const onTheRoof = (page: Page) => page.getByRole("list", { name: "On the roof" });

/** The tour as the test runs it forward: `at` takes it to a moment of a scene, its start or `into` milliseconds into it. */
type Tour = { at: (scene: number, into?: number) => Promise<void> };

/** The first frame of a moment: so that the stage is drawn before anything is read of it. */
const A_FRAME = 20;

/**
 * Present opened on the demo with the page's clock held: the tour begins at its first moment and goes on only as the
 * test runs the clock forward. The design's run comes meanwhile on the clock of the machine; the page waits for it.
 */
async function presentOpened(page: Page): Promise<Tour> {
  await page.clock.install({ time: OPENED });
  expect((await page.goto("/present"))?.status()).toBe(200);
  await page.clock.pauseAt(READY);
  await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });
  await expect(sceneWords(page)).toHaveText(SCENES[0].words);
  await page.clock.runFor(A_FRAME);
  let ran = A_FRAME;
  return {
    async at(scene, into = A_FRAME) {
      const to = SCENES.slice(0, scene).reduce((sum, one) => sum + one.duration, 0) + into;
      if (to < ran) throw new Error(`The tour stands at ${ran} ms and cannot go back to ${to}.`);
      await page.clock.runFor(to - ran);
      ran = to;
    },
  };
}

/** The series colours of design-tokens.md in their fixed order, and the modules' blue. */
const SERIES: Pixel[] = [
  [0x39, 0x87, 0xe5],
  [0xd9, 0x59, 0x26],
  [0x19, 0x9e, 0x70],
  [0xc9, 0x85, 0x00],
  [0xd5, 0x51, 0x81],
  [0x00, 0x83, 0x00],
];
const GLASS: Pixel = [0x16, 0x29, 0x4d];

/** Which of the six series colours, or the modules' blue (0), a pixel is nearest by its shares of each channel; a grey is nearest the blue. */
function seriesOfPixel(pixel: Pixel): number {
  const shares = ([red, green, blue]: Pixel) => {
    const sum = Math.max(1, red + green + blue);
    return [red / sum, green / sum, blue / sum];
  };
  const [r, g, b] = shares(pixel);
  const distances = [GLASS, ...SERIES].map((colour) => {
    const [cr, cg, cb] = shares(colour);
    return Math.hypot(r - cr, g - cg, b - cb);
  });
  return distances.indexOf(Math.min(...distances));
}

// Places in the middle band of the canvas, where the roof and its modules are.
const BAND: Share[] = [0.4, 0.5, 0.6].flatMap((y) => [0.3, 0.4, 0.5, 0.6, 0.7].map((x): Share => [x, y]));

test.beforeEach(({}, testInfo) => {
  test.skip(isPhone(testInfo.project.name), "The phone has no Present: its top bar has none (decision 8).");
  // The design's run, then the tour run forward through its frames in software WebGL: more than a test's half minute.
  test.setTimeout(RUN * 3);
});

test.describe("the way in and out", () => {
  test("the top bar's Present leads to /present, without the top bar and the workspaces", async ({ page }) => {
    await page.goto("/studio/array");
    const link = page.getByRole("banner").getByRole("link", { name: "Present" });
    await expect(link).toHaveAttribute("href", "/present");

    await link.click();

    await expect(page).toHaveURL(/\/present$/);
    await expect(present(page)).toBeVisible();
    await expect(page.getByRole("banner")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Workspaces" })).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveCount(1);
  });

  test("a key returns to the Studio's last lens and stops the tour", async ({ page }) => {
    await page.goto("/studio/sun");
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByRole("banner").getByRole("link", { name: "Present" }).click();
    await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });

    await page.keyboard.press("Escape");

    await expect(page).toHaveURL(/\/studio\/sun$/);
    await expect(page.getByRole("banner").getByRole("link", { name: "Present" })).toBeVisible();
    await expect(present(page)).toHaveCount(0);
  });

  test("a touch returns the same way", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "A touch is of the tablet.");
    await page.goto("/studio/strings");
    await expect(page.getByRole("region", { name: "Design vitals" }).getByText("617.8")).toBeVisible({ timeout: RUN });
    await page.getByRole("banner").getByRole("link", { name: "Present" }).click();
    await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });
    const size = page.viewportSize()!;

    await page.touchscreen.tap(size.width / 2, size.height / 2);

    await expect(page).toHaveURL(/\/studio\/strings$/);
    await expect(present(page)).toHaveCount(0);
  });

  test("a pointer's press returns too", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "A mouse is of the desktop.");
    await presentOpened(page);
    const size = page.viewportSize()!;

    await page.mouse.click(size.width / 2, size.height / 2);

    await expect(page).toHaveURL(/\/studio\/roof$/);
  });
});

test.describe("the tour", () => {
  test("the words name the design and the scene, over the stage's fade; the hint stands at the right", async ({ page }) => {
    await presentOpened(page);

    await expect(words(page)).toHaveText(FACTS);
    await expect(sceneWords(page)).toHaveText(SCENES[0].words);
    await expect(hint(page)).toHaveText(HINT);
    await expect(hint(page)).toHaveAttribute("data-state", "shown");
    const size = page.viewportSize()!;
    const [wordsBox, hintBox, stageBox] = await Promise.all([words(page).boundingBox(), hint(page).boundingBox(), stage(page).boundingBox()]);
    expect(wordsBox!.x).toBe(40);
    expect(Math.round(size.height - (wordsBox!.y + wordsBox!.height))).toBeGreaterThanOrEqual(28);
    expect(Math.round(size.width - (hintBox!.x + hintBox!.width))).toBe(40);
    expect([stageBox!.width, stageBox!.height]).toEqual([size.width, size.height]);
  });

  test("the scenes are seen in order by their words, each within its time", async ({ page }) => {
    const tour = await presentOpened(page);

    for (const [index, scene] of SCENES.entries()) {
      await tour.at(index, 100);
      await expect(sceneWords(page)).toHaveText(scene.words);
    }
  });

  test("in the modules' scene the stage's text equivalent counts fewer modules than the layout, then all", async ({ page }) => {
    const tour = await presentOpened(page);
    await expect(modulesSaid(page)).toHaveText(/^0 of [\d,]+ modules in \d+ rows$/);
    const total = Number((await modulesSaid(page).textContent())!.match(/of ([\d,]+) modules/)![1]!.replace(",", ""));
    expect(total).toBeGreaterThan(0);

    await tour.at(2, 3000);
    const half = Number((await modulesSaid(page).textContent())!.match(/^([\d,]+) of/)![1]!.replace(",", ""));
    expect(half).toBeGreaterThan(0);
    expect(half).toBeLessThan(total);

    await tour.at(3);
    await expect(modulesSaid(page)).toHaveText(new RegExp(`^${total.toLocaleString("en-US")} of ${total.toLocaleString("en-US")} modules`));
  });

  test("in the day's scene the time moves from sunrise toward sunset; the strings' scene holds the Studio's hour again", async ({ page }) => {
    const tour = await presentOpened(page);
    await expect(sunSaid(page)).toContainText("10:30 solar time");

    await tour.at(3, 100);
    const morning = (await sunSaid(page).textContent())!;
    expect(morning).toMatch(/0[67]:\d\d solar time/);
    await tour.at(3, 6000);
    const noon = (await sunSaid(page).textContent())!;
    expect(noon).toContain("12:00 solar time");
    expect(noon).not.toBe(morning);

    await tour.at(4, 100);
    await expect(sunSaid(page)).toContainText("10:30 solar time");
  });

  test("in the strings' scene the glass takes the series colours, by MPPT", async ({ page }) => {
    const tour = await presentOpened(page);
    await tour.at(2, 5900);
    const before = (await pixelsAt(page, BAND)).filter((pixel) => seriesOfPixel(pixel) > 0).length;
    expect(before, "no series colour before the strings' scene").toBeLessThanOrEqual(1);

    await tour.at(4, 2000);

    await expect(page.getByTestId("present-strings")).toContainText("coloured by MPPT");
    const during = (await pixelsAt(page, BAND)).filter((pixel) => seriesOfPixel(pixel) > 0).length;
    expect(during, "pixels of the middle band in a series colour").toBeGreaterThanOrEqual(3);
  });

  test("in the last scene the energy counts from 0 to the run's MWh, the chain cascading beside it; before it nothing of the figures is there", async ({ page }) => {
    const answered = page.waitForResponse((response) => response.url().endsWith("/api/design"), { timeout: RUN });
    const tour = await presentOpened(page);
    const events = (await (await answered).text()).split("\n").filter((line) => line.startsWith("data:"));
    const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { chosen_option: string; options: { key: string; energy: { energy_mwh: number; steps: { kind: string; label: string; value: number }[] } }[] } };
    const chosen = result.options.find((option) => option.key === result.chosen_option)!;
    const mwh = chosen.energy.energy_mwh.toFixed(1);
    await expect(page.getByTestId("present-energy")).toHaveCount(0);

    await tour.at(5, 1500);
    const figures = page.getByTestId("present-energy");
    await expect(figures).toHaveAttribute("data-state", "counting");
    await expect(figures).toContainText("Energy to grid, year 1");
    const midway = Number((await figures.getByTestId("stat-value").textContent())!.replace(/[^\d.]/g, ""));
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(Number(mwh));
    expect(await figures.getByTestId("present-chain").locator("[data-look]").count()).toBe(chosen.energy.steps.filter((step) => step.kind === "energy_total" || step.kind === "energy" || step.kind === "result").length);

    await tour.at(5, 6000 + A_FRAME);
    await expect(figures).toHaveAttribute("data-state", "counted");
    await expect(figures.getByTestId("stat-value")).toHaveText(`${mwh} MWh`);
    await expect(figures).toContainText(`Energy to grid ${mwh} MWh`);
    await expect(figures).toContainText(`Array nominal energy at STC ${chosen.energy.steps.find((step) => step.kind === "energy_total")!.value.toFixed(1)}`);
  });

  test("the loop begins again after 40 s, and the hint has faded", async ({ page }) => {
    const tour = await presentOpened(page);

    await tour.at(6, 100);

    await expect(sceneWords(page)).toHaveText(SCENES[0].words);
    await expect(hint(page)).toHaveAttribute("data-state", "faded");
    await expect(hint(page)).toHaveCSS("opacity", "0");
    await expect(modulesSaid(page)).toHaveText(/^0 of/);
    await expect(present(page).locator("canvas")).toBeVisible();
  });

  test("under reduced motion the scenes are cuts: everything whole from the start of its scene", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const tour = await presentOpened(page);
    await expect(onTheRoof(page)).toHaveAttribute("data-motion", "reduced");

    await tour.at(2);
    await expect(modulesSaid(page)).toHaveText(/^([\d,]+) of \1 modules/);
    await tour.at(3);
    await expect(sunSaid(page)).toHaveText(/0[67]:\d\d solar time/);
    await tour.at(3, 1000 + A_FRAME);
    await expect(sunSaid(page)).not.toHaveText(/0[67]:\d\d solar time/);
  });

  test("the stage is drawn: the middle of the screen is the design, not the background", async ({ page }) => {
    const tour = await presentOpened(page);
    await tour.at(3, 100);

    const [pixel] = await pixelsAt(page, [[0.5, 0.5]]);
    expect(Math.max(...pixel), `the middle of the stage is ${pixel.join(", ")}`).toBeGreaterThan(40);
  });

  test("it is accessible: no serious or critical finding", async ({ page }) => {
    const tour = await presentOpened(page);
    await tour.at(1, 100);

    const found = await new AxeBuilder({ page }).analyze();
    const serious = found.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

test("the canvas fills the screen with the stage's own background behind it", async ({ page }) => {
  await presentOpened(page);
  const box = (await sceneCanvas(page).boundingBox())!;
  const size = page.viewportSize()!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([size.width, size.height]);
  await expect(present(page)).toHaveCSS("background-color", "rgb(11, 14, 19)");
});
