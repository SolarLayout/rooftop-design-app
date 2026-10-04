import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { pixelsAt, sceneCanvas, stage, type Pixel, type Share } from "../stage";

// Present (plan/phase-10-plan.md, steps 18 to 21, decisions 8 to 11; the board "Present"): the Studio's stage on the whole
// screen without the shell's chrome, the tour of six scenes on the app's clock, looping; any key or touch returns to the
// Studio's last lens; reduced motion as cuts; nothing asked of the API; the frame budget. On desktop and tablet (the
// phone has no Present), the tour's frames on desktop alone. The page's clock is installed and run forward scene by
// scene, so that a test is not 40 s of waiting: every timer and animation frame of the page fires as the clock is run,
// and the stage stands still between.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
// The tests that run the tour forward frame by frame are the desktop's alone (plan/phase-11-plan.md, decision 3): the tour's
// logic has no size, and each renders seconds of the tour in software WebGL. What opens Present, reads its words and its hint,
// leaves it by a key or a touch, and axe run on desktop and tablet; the pictures of Present (present-screens.e2e.ts) on both.
const FRAMES_ON_DESKTOP = "The tour's logic has no size: its frames are rendered on desktop alone (plan/phase-11-plan.md, decision 3).";

const OPENED = new Date("2026-10-03T09:00:00");

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
const groundSaid = (page: Page) => page.getByTestId("present-ground");
const sunSaid = (page: Page) => page.getByTestId("present-sun");
const onTheRoof = (page: Page) => page.getByRole("list", { name: "On the roof" });

/** The tour as the test runs it forward: `at` takes it to a moment of a scene, its start or `into` milliseconds into it. */
type Tour = { at: (scene: number, into?: number) => Promise<void> };

/** The first frame of a moment: so that the stage is drawn before anything is read of it. */
const A_FRAME = 20;

const A_LOOP = SCENES.reduce((sum, one) => sum + one.duration, 0);

/** The scene's place at a moment of the tour, in milliseconds from its first moment. */
function sceneAt(moment: number): number {
  let start = 0;
  for (const [index, scene] of SCENES.entries()) {
    if (moment % A_LOOP < start + scene.duration) return index;
    start += scene.duration;
  }
  return SCENES.length - 1;
}

/** Where the tour stands, in milliseconds from its first moment, from the stage's text equivalent: the loops over, the scene's place and the milliseconds into it. */
async function standingAt(page: Page): Promise<number> {
  const said = await sceneWords(page).textContent();
  const scene = SCENES.findIndex((one) => one.words === said);
  const into = Number(await onTheRoof(page).getAttribute("data-into"));
  const loop = Number(await onTheRoof(page).getAttribute("data-loop"));
  return loop * A_LOOP + SCENES.slice(0, scene).reduce((sum, one) => sum + one.duration, 0) + into;
}

/**
 * Present opened on the demo with the page's clock the test's: it runs until the tour is on and the ground's imagery is
 * drawn (the stage does not come up under a clock held from the start), then it is held, and the tour goes on only as the
 * test runs the clock forward. Where the tour stands when the clock is held is read from the stage, so that `at` is exact.
 */
async function presentOpened(page: Page): Promise<Tour> {
  await page.clock.install({ time: OPENED });
  expect((await page.goto("/present"))?.status()).toBe(200);
  await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });
  await expect(modulesSaid(page)).toContainText("modules", { timeout: RUN });
  await expect(groundSaid(page)).toHaveText("The ground is the satellite imagery", { timeout: RUN });
  await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 100);
  await page.clock.runFor(A_FRAME);
  let ran = await standingAt(page);
  expect(ran, "the tour had left its first scene before the clock was held").toBeLessThan(SCENES[0].duration);
  return {
    async at(scene, into = A_FRAME) {
      const to = SCENES.slice(0, scene).reduce((sum, one) => sum + one.duration, 0) + into;
      if (to < ran) {
        // The clock was held later into this scene than the moment asked for: the scene is the one asked, and stands.
        if (sceneAt(to) === sceneAt(ran)) return;
        throw new Error(`The tour stands at ${ran} ms and cannot go back to ${to}.`);
      }
      await page.clock.runFor(to - ran);
      ran = to;
      // The tour's ticks are not aligned with the moment the clock was held: a tick or two may still be owed, and are run.
      for (let owed = to - (await standingAt(page)), tries = 0; owed > 0 && tries < 4; owed = to - (await standingAt(page)), tries += 1) await page.clock.runFor(owed);
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

// The tests of this file run one after the other in their worker: each renders seconds of the tour frame by frame in
// software WebGL, and four at once starve each other past their time.
test.describe.configure({ mode: "default" });

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

  test("the scenes are seen in order by their words, each within its time", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
    const tour = await presentOpened(page);

    for (const [index, scene] of SCENES.entries()) {
      await tour.at(index, 100);
      await expect(sceneWords(page)).toHaveText(scene.words);
    }
  });

  test("in the modules' scene the stage's text equivalent counts fewer modules than the layout, then all", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
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

  test("in the day's scene the time moves from sunrise toward sunset; the strings' scene holds the Studio's hour again", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
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

  test("in the strings' scene the glass takes the series colours, by MPPT", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
    const tour = await presentOpened(page);
    // The modules whole, the hour held: the band at the end of the filling scene against the same band in the strings' scene.
    await tour.at(2, 5900);
    const before = await pixelsAt(page, BAND);

    await tour.at(4, 2000);

    await expect(page.getByTestId("present-strings")).toContainText("coloured by MPPT");
    const during = await pixelsAt(page, BAND);
    // The ground's imagery under the band holds its greens and browns; the glass that took a series colour is what changed.
    const changed = during.filter((pixel, index) => Math.abs(pixel[0] - before[index]![0]) + Math.abs(pixel[1] - before[index]![1]) + Math.abs(pixel[2] - before[index]![2]) > 60);
    expect(changed.length, "pixels of the middle band that changed colour").toBeGreaterThanOrEqual(3);
    expect(changed.filter((pixel) => seriesOfPixel(pixel) > 0).length, "of them, in a series colour").toBeGreaterThanOrEqual(3);
  });

  test("in the last scene the energy counts from 0 to the run's MWh, the chain cascading beside it; before it nothing of the figures is there", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
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

  test("the loop begins again after 40 s, and the hint has faded", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
    const tour = await presentOpened(page);

    await tour.at(6, 100);

    await expect(sceneWords(page)).toHaveText(SCENES[0].words);
    await expect(hint(page)).toHaveAttribute("data-state", "faded");
    await expect(hint(page)).toHaveCSS("opacity", "0");
    await expect(modulesSaid(page)).toHaveText(/^0 of/);
    await expect(present(page).locator("canvas")).toBeVisible();
  });

  test("under reduced motion the scenes are cuts: everything whole from the start of its scene", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const tour = await presentOpened(page);
    await expect(onTheRoof(page)).toHaveAttribute("data-motion", "reduced");

    await tour.at(2);
    await expect(modulesSaid(page)).toHaveText(/^([\d,]+) of \1 modules/);
    await tour.at(3);
    await expect(sunSaid(page)).toHaveText(/0[67]:\d\d solar time/);
    const firstCut = (await sunSaid(page).textContent())!;
    // The day in twelve cuts, one a second: the second cut is an hour on, still in the morning.
    await tour.at(3, 1000 + A_FRAME);
    await expect(sunSaid(page)).not.toHaveText(firstCut);
    await expect(sunSaid(page)).toHaveText(/0[789]:\d\d solar time/);
  });

  test("the stage is drawn: the middle of the screen is the design, not the background", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
    const tour = await presentOpened(page);
    await tour.at(3, 100);

    const [pixel] = await pixelsAt(page, [[0.5, 0.5]]);
    expect(Math.max(...pixel), `the middle of the stage is ${pixel.join(", ")}`).toBeGreaterThan(40);
  });

  test("it is accessible: no serious or critical finding", async ({ page }) => {
    // On the clock of the machine: axe runs on the page's timers.
    await page.goto("/present");
    await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });
    await expect(modulesSaid(page)).toContainText("modules", { timeout: RUN });

    const found = await new AxeBuilder({ page }).analyze();
    const serious = found.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(serious.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

// Nothing of Present asks the API (plan/phase-10-plan.md, step 20, decision 8): once the design is loaded the tour runs
// from the results kept in the stores, so it works with the API offline.
test("with every route of the API refused during the tour, nothing is asked and a whole loop completes", async ({ page }, testInfo) => {
  test.skip(!isDesktop(testInfo.project.name), FRAMES_ON_DESKTOP);
  const tour = await presentOpened(page);
  const asked: string[] = [];
  await page.route("**/api/**", (route) => {
    asked.push(new URL(route.request().url()).pathname);
    return route.abort("connectionrefused");
  });

  await tour.at(5, 6000 + A_FRAME);
  await expect(page.getByTestId("present-energy")).toHaveAttribute("data-state", "counted");
  await tour.at(6, 100);

  await expect(sceneWords(page)).toHaveText(SCENES[0].words);
  await expect(hint(page)).toHaveAttribute("data-state", "faded");
  await expect(words(page)).toHaveText(FACTS);
  expect(asked, "routes of the API asked during the tour").toEqual([]);
});

/** Whether the page draws with software WebGL (SwiftShader, as the tests do), by the renderer the browser names. */
async function isSoftwareWebGL(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2") ?? document.createElement("canvas").getContext("webgl");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    return /swiftshader|software/i.test(renderer);
  });
}

/** What a page measures of its own frames and memory while the tour runs on the real clock. */
type Budget = { frames: number; longest: number; over: number; heapBefore: number | null; heapAfter: number | null };

/** Frame times sampled with requestAnimationFrame for `milliseconds`, and the heap of the page before and after. */
async function budgetOf(page: Page, milliseconds: number): Promise<Budget> {
  return page.evaluate(
    (length) =>
      new Promise<Budget>((resolve) => {
        const heap = () => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null;
        const heapBefore = heap();
        let frames = 0;
        let longest = 0;
        let over = 0;
        const began = performance.now();
        let last = began;
        function frame(now: number) {
          const took = now - last;
          last = now;
          frames += 1;
          longest = Math.max(longest, took);
          if (took > 50) over += 1;
          if (now - began < length) requestAnimationFrame(frame);
          else resolve({ frames, longest, over, heapBefore, heapAfter: heap() });
        }
        requestAnimationFrame(frame);
      }),
    milliseconds,
  );
}

// The frame budget (plan/phase-10-plan.md, step 21, decision 11; the acceptance): no frame over 50 ms through two loops
// of the tour, on the real clock, and the heap not grown by more than a quarter. The 30 minutes are the soak's
// (tools/present-soak.ts), run once by the session.
test("over two loops on the real clock no frame takes more than 50 ms, and the memory does not climb", async ({ page }) => {
  test.setTimeout(RUN * 4);
  await page.goto("/present");
  // The budget is of a stand's graphics: in software WebGL a frame of the stage takes longer whatever the code does
  // (plan/phase-10-plan.md, decision 11); there the soak with the machine's graphics (tools/present-soak.ts) is the measure.
  test.skip(await isSoftwareWebGL(page), "Software WebGL draws a frame of the stage in more than 50 ms; the soak with the machine's graphics is the measure.");
  await expect(present(page)).toHaveAttribute("data-state", "touring", { timeout: RUN });
  await expect(modulesSaid(page)).toContainText("modules", { timeout: RUN });

  const budget = await budgetOf(page, 2 * 40_000 + 1_000);

  expect(budget.frames).toBeGreaterThan(100);
  expect(budget.over, `${budget.over} of ${budget.frames} frames over 50 ms, the longest ${Math.round(budget.longest)} ms`).toBe(0);
  expect(budget.heapBefore).not.toBeNull();
  expect(budget.heapAfter!, `the heap went from ${budget.heapBefore} to ${budget.heapAfter}`).toBeLessThanOrEqual(budget.heapBefore! * 1.25);
  await expect(sceneWords(page)).toBeVisible();
});

test("the canvas fills the screen with the stage's own background behind it", async ({ page }) => {
  await presentOpened(page);
  const box = (await sceneCanvas(page).boundingBox())!;
  const size = page.viewportSize()!;
  expect([Math.round(box.width), Math.round(box.height)]).toEqual([size.width, size.height]);
  await expect(present(page)).toHaveCSS("background-color", "rgb(11, 14, 19)");
});
