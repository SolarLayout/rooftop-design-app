import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, Request, Route } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { A_MAP, atTheRoof, drawTheRectangle, roofMap } from "../find";
import { expect, test } from "../fixtures";
import { switchLens } from "../stage";

// The weather source and the assumptions of Performance (plan/phase-08-plan.md, steps 16 and 18 to 21; the board "Weather
// and assumptions"): NASA chosen is downloaded first (answered from the fixture), committed once and run; undo gives PVGIS
// back without a download; a download refused says the API's words and keeps the source of before; a CSV is read in its
// dialog with the API's summary and notes before Use, a file that is no weather CSV refused in the API's words; the
// assumptions are fields of the document, each asking one run and no layout; a roof built on the map, which has no
// weather, gets it through /api/weather once (decision 11). Every number and every word is read from the API's answers.

const RUN = 90_000;
/** Another weather computes the shading again: 11 to 12 s on the demo, longer under load. */
const A_NEW_WEATHER = 150_000;
/** The pause before a run, twice over: after it, a run that was to come has been asked for. */
const LONGER_THAN_THE_PAUSE = 1_000;

type Energy = { energy_mwh: number; co2_t: number; sigma_pct: number; p_values: { level: number; mwh: number }[] };
type Option = { key: string; energy: Energy };
type Weather = { source: "pvgis" | "nasa" | "csv"; label: string; hours: number; t_min_c: number; t_max_c: number; horizon_highest_deg: number | null };
type Answer = { options: Option[]; chosen_option: string | null; weather: Weather; weather_notes: string[]; no_options: { title: string } | null };
type Summary = { hours: number; ghi_kwh_m2: number; dni_kwh_m2: number; dhi_kwh_m2: number; t_min_c: number; t_max_c: number };
type WeatherAnswer = { weather: { label: string; time: string[]; ghi: number[] }; summary: Summary; notes: string[] };
type Losses = { uc: number | null; p_levels: number[]; co2_t_per_mwh: number };
type Document = { weather_source: string; weather_csv: string; weather_csv_text: string; weather_json: { label: string; time: string[] } | null; losses: Losses; system_voltage: number | null };

const FIXTURES = path.resolve(__dirname, "../fixtures");
const PVGIS_FIXTURE: WeatherAnswer = JSON.parse(readFileSync(path.join(FIXTURES, "weather-pvgis-pune.json"), "utf8"));
const NASA_FIXTURE = path.join(FIXTURES, "weather-nasa-pune.json");
/** The API's refusal of a site PVGIS does not cover, as recorded for the tests (apps/api/tests/recorded.py). */
const OVER_THE_SEA = {
  error: {
    code: "no_weather_for_site",
    message: "PVGIS TMY has no weather for 10.0000, 65.0000: Location over the sea. Please, select another location. Check the site, or choose another weather source.",
    field: null,
  },
};
/** A CSV of time and GHI alone, built from the hours of the PVGIS fixture: the engine works beam and diffuse out, and takes 25 °C and 1 m/s. */
const GHI_ONLY_CSV = ["time,ghi", ...PVGIS_FIXTURE.weather.time.map((time, hour) => `${time},${PVGIS_FIXTURE.weather.ghi[hour]}`)].join("\n");
const SOURCE = { pvgis: "PVGIS", nasa: "NASA POWER", csv: "CSV" };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const isARun = (request: Request) => request.url().endsWith("/api/design");
const ran = (page: Page) => page.waitForRequest(isARun, { timeout: RUN });
const weatherAsked = (page: Page) => page.waitForRequest((request) => request.url().endsWith("/api/weather"), { timeout: RUN });
const documentOf = (request: Request) => request.postDataJSON() as Document;
/** A number as the page shows it: fixed decimals, a comma between thousands. */
const fixed = (value: number, decimals: number) => value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const isPhone = (projectName: string) => projectName === "phone";
const undoKey = (projectName: string) => (projectName === "desktop" ? "Meta+z" : "Control+z");

/** The weather's part of the line under the title, in the board's words (decision 2). */
function weatherLineOf({ hours, source, t_min_c, t_max_c, horizon_highest_deg }: Weather): string {
  const horizon = horizon_highest_deg === null ? "no horizon" : `horizon up to ${fixed(horizon_highest_deg, 1)}°`;
  return `${fixed(hours, 0)} hours of ${SOURCE[source]} weather, ${fixed(t_min_c, 1)} to ${fixed(t_max_c, 1)} °C, ${horizon}`;
}

const energyTile = (page: Page) => page.getByTestId("kpi-energy");
const runLine = (page: Page) => page.getByTestId("run-line");
const weatherTrigger = (page: Page) => page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ });
const weatherList = (page: Page) => page.getByRole("listbox", { name: "Weather" });
const weatherNote = (page: Page) => page.getByTestId("weather-failed");
const csvDialog = (page: Page) => page.getByRole("dialog", { name: "Load weather from a CSV" });
const assumptions = (page: Page) => page.getByTestId("assumptions");
const assumption = (page: Page, name: string) => assumptions(page).getByRole("textbox", { name });
const pCells = (page: Page) => page.getByTestId("p-value");
const workspaces = (page: Page) => page.getByRole("navigation", { name: "Workspaces" }).filter({ visible: true });

async function thePerformancePage(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/performance");
  const answer = await resultOf(await first);
  await expect(energyTile(page)).toContainText(fixed(chosenOf(answer).energy.energy_mwh, 1), { timeout: RUN });
  return answer;
}

/** A source chosen from the weather select, by the start of its name. */
async function chooseWeather(page: Page, name: string): Promise<void> {
  await weatherTrigger(page).click();
  await weatherList(page).getByRole("option", { name: new RegExp(`^${name}`) }).click();
}

/** Enters a value into a field and commits it with Enter. */
async function enter(field: Locator, value: string): Promise<void> {
  await field.fill(value);
  await field.press("Enter");
}

/** Every request of the weather, the layout or the run from now on, by its path. */
function asked(page: Page): string[] {
  const paths: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(design|layout|weather)$/.test(request.url())) paths.push(new URL(request.url()).pathname);
  });
  return paths;
}

/** The keys of undo are the page's, not a field's: the focus leaves the control first. */
async function undo(page: Page, projectName: string): Promise<void> {
  await page.getByRole("heading", { level: 1, name: "Performance" }).click({ force: true });
  await page.keyboard.press(undoKey(projectName));
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

/** The CSV dialog opened and a file given to it; gives the API's answer to the file. */
async function aFileRead(page: Page, name: string, text: string) {
  await chooseWeather(page, "CSV file");
  await expect(csvDialog(page)).toBeVisible();
  const read = page.waitForResponse((response) => response.url().endsWith("/api/weather"), { timeout: RUN });
  await csvDialog(page).locator("input[type=file]").setInputFiles({ name, mimeType: "text/csv", buffer: Buffer.from(text) });
  return read;
}

test.describe.configure({ timeout: A_NEW_WEATHER * 2 });

test.describe("the weather source (decision 12)", () => {
  test("NASA chosen: the trigger says it at once with the ring while the hours come; one /api/weather, one run with NASA's hours and no layout; the line says NASA and no horizon; undo gives PVGIS back without a download", async ({ page }, testInfo) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);
    let held: Route | null = null;
    await page.route("**/api/weather", (route) => {
      held = route;
    });
    const weather = weatherAsked(page);
    const next = ran(page);

    await chooseWeather(page, "NASA POWER 2023");

    // The hours are on their way: the trigger says the new name with the ring, the line is dimmed and the load is said under it.
    await expect(weatherTrigger(page)).toContainText("NASA POWER 2023");
    await expect(weatherTrigger(page).locator("svg.turning")).toHaveCount(1);
    await expect(page.getByTestId("run-step")).toContainText("Loading NASA POWER 2023 weather");
    await expect(runLine(page)).toHaveClass(/opacity-updating/);
    await expect(runLine(page)).toContainText(weatherLineOf(before.weather));
    await expect.poll(() => held !== null).toBe(true);
    await (held as unknown as Route).fulfill({ path: NASA_FIXTURE, contentType: "application/json" });
    await page.unroute("**/api/weather");

    const asked_ = await weather;
    expect(asked_.postDataJSON()).toMatchObject({ source: "nasa" });
    expect(asked_.postDataJSON().lat).toBeCloseTo(18.52, 2);
    expect(asked_.postDataJSON().lon).toBeCloseTo(73.86, 2);
    const hours = ((await (await asked_.response())!.json()) as WeatherAnswer).weather.time.length;
    const run = await next;
    const document = documentOf(run);
    expect(document.weather_source).toBe("nasa");
    expect(document.weather_json?.label).toBe("NASA POWER 2023");
    expect(document.weather_json?.time).toHaveLength(hours);
    expect(document.weather_csv).toBe("");
    await expect(weatherTrigger(page)).toContainText("NASA POWER 2023");
    await expect(weatherTrigger(page).locator("svg.turning")).toHaveCount(0);

    const after = await resultOf(run);
    expect(after.weather.source).toBe("nasa");
    expect(after.weather.horizon_highest_deg).toBeNull();
    await expect(energyTile(page)).toContainText(fixed(chosenOf(after).energy.energy_mwh, 1), { timeout: A_NEW_WEATHER });
    await expect(runLine(page)).toContainText(weatherLineOf(after.weather));
    await expect(runLine(page)).toContainText("no horizon");
    expect(fixed(chosenOf(after).energy.energy_mwh, 1)).not.toBe(fixed(chosenOf(before).energy.energy_mwh, 1));
    expect(paths.filter((asked) => asked.endsWith("/weather"))).toHaveLength(1);
    expect(paths.filter((asked) => asked.endsWith("/design"))).toHaveLength(1);
    expect(paths.filter((asked) => asked.endsWith("/layout"))).toEqual([]);

    // Undone, the document of before has its PVGIS hours: the run follows without a download.
    const back = ran(page);
    await undo(page, testInfo.project.name);
    await expect(weatherTrigger(page)).toContainText("PVGIS TMY");
    const undone = documentOf(await back);
    expect(undone.weather_source).toBe("pvgis");
    expect(undone.weather_json?.label).toBe("PVGIS TMY");
    await expect(energyTile(page)).toContainText(fixed(chosenOf(before).energy.energy_mwh, 1), { timeout: A_NEW_WEATHER });
    await expect(runLine(page)).toContainText(weatherLineOf(before.weather));
    expect(paths.filter((asked) => asked.endsWith("/weather"))).toHaveLength(1);
  });

  test("a download refused: the API's words under the select, the source of before kept, no run; the note goes with the next choice", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);
    await page.route("**/api/weather", (route) => route.fulfill({ status: 422, json: OVER_THE_SEA }));

    await chooseWeather(page, "NASA POWER 2023");

    await expect(weatherNote(page)).toContainText("The weather was not loaded");
    await expect(weatherNote(page)).toContainText(OVER_THE_SEA.error.message);
    await expect(weatherTrigger(page)).toContainText("PVGIS TMY");
    await expect(weatherTrigger(page).locator("svg.turning")).toHaveCount(0);
    await expect(runLine(page)).toContainText(weatherLineOf(before.weather));
    await expect(runLine(page)).not.toHaveClass(/opacity-updating/);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(before).energy.energy_mwh, 1));
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(paths.filter((asked) => asked.endsWith("/design"))).toEqual([]);
    expect(paths.filter((asked) => asked.endsWith("/weather"))).toHaveLength(1);

    await page.unroute("**/api/weather");
    await chooseWeather(page, "NASA POWER 2023");

    await expect(weatherNote(page)).toHaveCount(0);
  });
});

test.describe("a CSV with its notes (step 19)", () => {
  test("a CSV of time and GHI: the file's card with the API's summary in three lines and its three notes, word for word; Use runs with it, and the notes stand under the line", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);

    const read = await aFileRead(page, "pune-ghi.csv", GHI_ONLY_CSV);
    const answer = (await read.json()) as WeatherAnswer;
    expect(read.status()).toBe(200);
    expect(answer.notes).toHaveLength(3);
    const { summary } = answer;

    const drop = csvDialog(page).getByTestId("file-drop");
    await expect(drop).toContainText("pune-ghi.csv");
    await expect(drop.getByTestId("file-drop-line")).toHaveText([
      `${fixed(summary.hours, 0)} hours · GHI ${fixed(summary.ghi_kwh_m2, 1)} kWh/m²`,
      `beam ${fixed(summary.dni_kwh_m2, 1)} · diffuse ${fixed(summary.dhi_kwh_m2, 1)} kWh/m²`,
      `${fixed(summary.t_min_c, 1)} to ${fixed(summary.t_max_c, 1)} °C`,
    ]);
    await expect(csvDialog(page).getByTestId("csv-note")).toHaveText(answer.notes);
    await expect(csvDialog(page).getByRole("button", { name: "Use this weather" })).not.toHaveAttribute("aria-disabled", "true");
    // Nothing is committed before Use.
    expect(paths.filter((asked) => asked.endsWith("/design"))).toEqual([]);

    const next = ran(page);
    await csvDialog(page).getByRole("button", { name: "Use this weather" }).click();

    await expect(csvDialog(page)).toBeHidden();
    const run = await next;
    const document = documentOf(run);
    expect(document.weather_source).toBe("csv");
    expect(document.weather_csv).toBe("pune-ghi.csv");
    expect(document.weather_csv_text).toBe(GHI_ONLY_CSV);
    expect(document.weather_json?.time).toHaveLength(answer.weather.time.length);
    await expect(weatherTrigger(page)).toContainText("pune-ghi.csv");

    const after = await resultOf(run);
    expect(after.weather.source).toBe("csv");
    expect(after.weather_notes).toEqual(answer.notes);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(after).energy.energy_mwh, 1), { timeout: A_NEW_WEATHER });
    await expect(runLine(page)).toContainText(weatherLineOf(after.weather));
    await expect(page.getByTestId("weather-note")).toHaveText(after.weather_notes);
    expect(fixed(chosenOf(after).energy.energy_mwh, 1)).not.toBe(fixed(chosenOf(before).energy.energy_mwh, 1));
    expect(paths.filter((asked) => asked.endsWith("/weather"))).toHaveLength(1);
    expect(paths.filter((asked) => asked.endsWith("/layout"))).toEqual([]);
  });

  test("a file of two words is refused in the API's words; Use waits; Cancel leaves the weather of before", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);

    const refused = await aFileRead(page, "notes.txt", "two words");
    expect(refused.status()).toBe(422);
    const { error } = (await refused.json()) as { error: { code: string; message: string } };
    expect(error.code).toBe("not_a_weather_csv");

    const drop = csvDialog(page).getByTestId("file-drop");
    await expect(drop).toContainText("This file was not loaded");
    await expect(drop).toContainText(error.message);
    await expect(csvDialog(page).getByTestId("csv-note")).toHaveCount(0);
    await expect(csvDialog(page).getByRole("button", { name: "Use this weather" })).toHaveAttribute("aria-disabled", "true");

    await csvDialog(page).getByRole("button", { name: "Use this weather" }).click();
    await expect(csvDialog(page)).toBeVisible();
    await csvDialog(page).getByRole("button", { name: "Cancel" }).click();

    await expect(csvDialog(page)).toBeHidden();
    await expect(weatherTrigger(page)).toContainText("PVGIS TMY");
    await expect(runLine(page)).toContainText(weatherLineOf(before.weather));
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(paths.filter((asked) => asked.endsWith("/design"))).toEqual([]);
  });
});

test.describe("the assumptions (decisions 6 and 8)", () => {
  test("Uc 25 entered: one run and no layout, the energy changes, the field holds 25 with the press that gives it back; given back, it is empty again", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);
    const uc = assumption(page, "Thermal Uc");
    await expect(uc).toHaveValue("");
    await expect(assumptions(page)).toContainText("by roof type");
    const next = ran(page);

    await enter(uc, "25");

    const run = await next;
    expect(documentOf(run).losses.uc).toBe(25);
    const after = await resultOf(run);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(after).energy.energy_mwh, 1), { timeout: RUN });
    expect(fixed(chosenOf(after).energy.energy_mwh, 1)).not.toBe(fixed(chosenOf(before).energy.energy_mwh, 1));
    await expect(uc).toHaveValue("25");
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(paths.filter((asked) => asked.endsWith("/design"))).toHaveLength(1);
    expect(paths.filter((asked) => asked.endsWith("/layout"))).toEqual([]);

    const back = ran(page);
    await assumptions(page).getByRole("button", { name: "Use the roof type's" }).click();

    expect(documentOf(await back).losses.uc).toBeNull();
    await expect(uc).toHaveValue("");
    await expect(assumptions(page).getByRole("button", { name: "Use the roof type's" })).toHaveCount(0);
  });

  test("the levels 50, 90, 99: the second field set to 99 sorts them, and the cells of the energy follow", async ({ page }) => {
    await thePerformancePage(page);
    await expect(pCells(page)).toHaveText([/^P50/, /^P75/, /^P90/]);
    const next = ran(page);

    await enter(assumption(page, "Exceedance level 2"), "99");

    const run = await next;
    expect(documentOf(run).losses.p_levels).toEqual([50, 90, 99]);
    await expect(assumption(page, "Exceedance level 1")).toHaveValue("50");
    await expect(assumption(page, "Exceedance level 2")).toHaveValue("90");
    await expect(assumption(page, "Exceedance level 3")).toHaveValue("99");
    const { energy } = chosenOf(await resultOf(run));
    expect(energy.p_values.map((value) => value.level)).toEqual([50, 90, 99]);
    await expect(pCells(page).last()).toContainText(fixed(energy.p_values[2]!.mwh, 1), { timeout: RUN });
    for (const [index, { level, mwh }] of energy.p_values.entries()) {
      await expect(pCells(page).nth(index)).toContainText(`P${level}`);
      await expect(pCells(page).nth(index)).toContainText(fixed(mwh, 1));
    }
    await expect(pCells(page).last()).toContainText(`σ ${fixed(energy.sigma_pct, 2)} %`);
  });

  test("CO₂ 0.8 t/MWh: one run, and the CO₂ tile follows at once", async ({ page }) => {
    const before = await thePerformancePage(page);
    const paths = asked(page);
    const next = ran(page);

    await enter(assumption(page, "Grid CO₂"), "0.8");

    const run = await next;
    expect(documentOf(run).losses.co2_t_per_mwh).toBe(0.8);
    const after = await resultOf(run);
    // Nothing of the hours is touched (decision 5): the answer comes in about a quarter of a second.
    await expect(page.getByTestId("kpi-co2")).toContainText(`${fixed(chosenOf(after).energy.co2_t, 1)} t/yr`, { timeout: 5_000 });
    expect(fixed(chosenOf(after).energy.co2_t, 1)).not.toBe(fixed(chosenOf(before).energy.co2_t, 1));
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(paths.filter((asked) => asked.endsWith("/design"))).toHaveLength(1);
    expect(paths.filter((asked) => asked.endsWith("/layout"))).toEqual([]);
  });

  test("before a system voltage the assumptions stand as fields under the API's words (decision 15)", async ({ page }) => {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    const first = ran(page);
    await page.goto("/performance");
    const answer = await resultOf(await first);

    await expect(page.getByTestId("energy-waits")).toContainText(answer.no_options!.title, { timeout: RUN });
    await expect(assumptions(page)).toBeVisible();
    await expect(assumption(page, "Thermal Uc")).toHaveValue("");
    await expect(assumption(page, "Grid CO₂")).toHaveValue("0.716");
    await expect(page.locator("body")).not.toContainText("MWh");
  });
});

test.describe("weather for a design that has none (decision 11)", () => {
  test("a roof built on the map gets its energy through /api/weather, asked once and answered from the fixture", async ({ page }) => {
    test.setTimeout(A_MAP + RUN * 4);
    const weathers: Request[] = [];
    const runs: Document[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/weather")) weathers.push(request);
      if (isARun(request)) runs.push(documentOf(request));
    });
    await page.goto("/find");
    await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    await atTheRoof(page);
    await drawTheRectangle(page);

    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    // The first run is refused for want of weather; the flow loads PVGIS for the roof's place and runs again with it.
    await expect.poll(() => weathers.length, { timeout: RUN }).toBe(1);
    expect(weathers[0]!.postDataJSON()).toMatchObject({ source: "pvgis" });
    expect(weathers[0]!.postDataJSON().lat).toBeCloseTo(18.52, 2);
    expect(weathers[0]!.postDataJSON().lon).toBeCloseTo(73.86, 2);
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(2);
    expect(runs[0]!.weather_json).toBeFalsy();
    expect(runs[1]!.weather_json?.label).toBe("PVGIS TMY");
    expect(runs[1]!.weather_json?.time.length).toBeGreaterThan(0);
    expect(runs[1]!.system_voltage).toBeNull();

    // A voltage chosen: the run has its weather already, and nothing is downloaded again.
    await switchLens(page, "Strings");
    const withAVoltage = page.waitForRequest((request) => isARun(request) && documentOf(request).system_voltage === 1500, { timeout: RUN });
    await page.getByTestId("voltage-decision").filter({ visible: true }).getByRole("button", { name: "1500 V" }).click();
    const answer = await resultOf(await withAVoltage);
    expect(answer.options.length).toBeGreaterThan(0);

    await workspaces(page).getByRole("link", { name: "Performance" }).click();
    await expect(page).toHaveURL(/\/performance$/);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(answer).energy.energy_mwh, 1), { timeout: RUN });
    await expect(weatherTrigger(page)).toContainText("PVGIS TMY");
    await expect(runLine(page)).toContainText(weatherLineOf(answer.weather));
    expect(weathers).toHaveLength(1);
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical with the select open, with the CSV dialog and its file read, and on the assumptions", async ({ page }) => {
    await thePerformancePage(page);
    expect(await grave(page)).toEqual([]);

    await weatherTrigger(page).click();
    await expect(weatherList(page)).toBeVisible();
    expect(await grave(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(weatherList(page)).toBeHidden();

    await aFileRead(page, "pune-ghi.csv", GHI_ONLY_CSV);
    await expect(csvDialog(page).getByTestId("csv-note")).toHaveCount(3);
    expect(await grave(page)).toEqual([]);
    await csvDialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(csvDialog(page)).toBeHidden();

    await assumption(page, "Thermal Uc").focus();
    expect(await grave(page)).toEqual([]);
  });
});
