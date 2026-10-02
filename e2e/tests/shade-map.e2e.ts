import type { Page, Response } from "@playwright/test";
import { expect, test } from "../fixtures";
import { inThePlan, pixelsAt, sceneCanvas, sceneSettled, stage, switchLens, type Pixel, type Share } from "../stage";

// The shading figures and the shade map (plan/phase-06-plan.md, steps 10 to 13, decisions 11 to 14; the boards
// "Studio, Sun lens" and "Shade map"): every number on the screen is the design run's, read here from its
// answer; the map colours the modules without rebuilding them; a module pressed says its loss and its
// string's; the map stays in the Sun lens. On three sizes.

const RUN = 90_000;
const isPhone = (projectName: string) => projectName === "phone";

type Step = { label: string; pct: number };
type Answer = {
  layout: { modules: { idx: number; row: number; outline: [number, number][] }[] };
  readouts: { keepout_area_m2: number };
  shading: { near_pct_by_module: number[] };
  far_shading_note: string;
  chosen_option: string;
  options: { key: string; letter: string; n_modules: number; energy: { steps: Step[] }; system: { strings: { label: string; modules: number[]; shade_pct: number }[] } }[];
};

/** The result of the design run, from the events of its answer. */
async function resultOf(response: Response): Promise<Answer> {
  const events = (await response.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

/** The Sun lens on the demo with its first run over; the run's answer. On phone the sheet open to its full stop. */
async function sunLensWithTheRun(page: Page, projectName: string): Promise<Answer> {
  const answered = page.waitForResponse((response) => response.url().endsWith("/api/design"), { timeout: RUN });
  await page.goto("/studio/sun");
  const result = await resultOf(await answered);
  await sceneSettled(page);
  if (isPhone(projectName)) {
    await page.getByRole("separator", { name: "Inspector" }).focus();
    await page.keyboard.press("End");
  }
  return result;
}

const percent = (value: number) => Math.abs(value).toFixed(2);
const shading = (page: Page) => page.getByRole("region", { name: "Shading over the year" });
const tab = (page: Page, name: string) => page.getByRole("radiogroup", { name: "Sun lens" }).getByRole("radio", { name });
const moduleWrites = async (page: Page) => Number(await stage(page).getAttribute("data-module-writes"));

/** Violet: the hue of the shade map, blue and red over green; the modules' blue has little red. */
const isViolet = ([red, green, blue]: Pixel) => blue > green + 12 && red > green + 6;

test.beforeEach(() => test.setTimeout(RUN * 2));

test.describe("the shading figures", () => {
  test("are the chosen option's loss chain, with what they count and the engine's note on the horizon", async ({ page }, testInfo) => {
    const result = await sunLensWithTheRun(page, testInfo.project.name);
    const option = result.options.find((one) => one.key === result.chosen_option)!;
    const step = (label: string) => option.energy.steps.find((one) => one.label === label)!.pct;

    await expect(shading(page)).toContainText(`Near, linear${percent(step("Near shading, linear"))} %`, { timeout: RUN });
    await expect(shading(page)).toContainText(`Electrical, beyond linear${percent(step("Electrical shading"))} %`);
    await expect(shading(page)).toContainText(`Far, horizon${percent(step("Far shading, horizon"))} %`);
    await expect(shading(page)).toContainText(`Kept clear${Math.round(result.readouts.keepout_area_m2)} m²`);
    await expect(shading(page).getByTestId("shading-of")).toHaveText(`Of the ${option.n_modules} modules of option ${option.letter}`);
    await expect(shading(page).getByTestId("shading-horizon")).toHaveText(result.far_shading_note);
  });
});

test.describe("the shade map", () => {
  test("colours the modules by the run's shading, in its steps, without rebuilding them", async ({ page }, testInfo) => {
    const result = await sunLensWithTheRun(page, testInfo.project.name);
    const losses = result.shading.near_pct_by_module;
    const counts = [0, 1, 2, 3, 4].map((step) => losses.filter((loss) => Math.min(4, Math.floor(loss)) === step).length);
    const writes = await moduleWrites(page);
    const middle: Share[] = [0.45, 0.5, 0.55].flatMap((y) => [0.4, 0.5, 0.6].map((x): Share => [x, y]));
    const before = await pixelsAt(page, middle);

    await tab(page, "Shade map").click();

    await expect(page.getByTestId("on-the-roof-shade-map")).toHaveText(`The shade map: near shading over the year from 0 to 5 %, by steps of 1 %: ${counts.slice(0, 4).join(", ")} and ${counts[4]} positions`, { timeout: RUN });
    await expect(page.getByTestId("shade-legend")).toContainText("Near shading over the year");
    await expect(page.getByTestId("shade-step")).toHaveCount(5);
    await expect.poll(async () => (await pixelsAt(page, middle)).filter(isViolet).length, { timeout: RUN }).toBeGreaterThan(before.filter(isViolet).length);
    expect(await moduleWrites(page)).toBe(writes);

    await tab(page, "Shadows").click();
    await expect(page.getByTestId("on-the-roof-shade-map")).toHaveCount(0);
    expect(await moduleWrites(page)).toBe(writes);
  });

  test("a module pressed says its loss over the year and its string's, as the run has them", async ({ page }, testInfo) => {
    const result = await sunLensWithTheRun(page, testInfo.project.name);
    const option = result.options.find((one) => one.key === result.chosen_option)!;
    const losses = result.shading.near_pct_by_module;
    // The most shaded position that the option wires.
    const wired = new Map(option.system.strings.flatMap((string) => string.modules.map((idx) => [idx, string] as const)));
    const idx = [...wired.keys()].sort((a, b) => losses[b] - losses[a])[0];
    const position = result.layout.modules.find((one) => one.idx === idx)!;
    const string = wired.get(idx)!;
    await tab(page, "Shade map").click();
    if (isPhone(testInfo.project.name)) {
      await page.getByRole("separator", { name: "Inspector" }).focus();
      await page.keyboard.press("Home");
    }

    const point = await inThePlan(page);
    const [x, y] = position.outline.reduce(([sx, sy], [px, py]) => [sx + px / 4, sy + py / 4], [0, 0]);
    const at = point(x, y);
    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(at.x, at.y);
    else await page.mouse.click(at.x, at.y);

    const callout = page.getByTestId("stage-callout");
    await expect(callout).toContainText(`Position ${idx + 1} · row ${position.row + 1}`, { timeout: RUN });
    await expect(callout).toContainText(`Near shading ${losses[idx].toFixed(2)} % over the year · string ${string.label}, ${string.shade_pct.toFixed(2)} %`);
  });

  test("stays in the Sun lens: in another lens the modules are of their blue", async ({ page }, testInfo) => {
    await sunLensWithTheRun(page, testInfo.project.name);
    await tab(page, "Shade map").click();
    await expect(page.getByTestId("on-the-roof-shade-map")).toHaveCount(1, { timeout: RUN });

    await switchLens(page, "Array");

    await expect(page.getByTestId("on-the-roof-shade-map")).toHaveCount(0);
    await expect(page.getByTestId("shade-legend")).toHaveCount(0);
    await expect(sceneCanvas(page)).toBeVisible();
  });
});
