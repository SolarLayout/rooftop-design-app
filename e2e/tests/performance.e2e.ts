import AxeBuilder from "@axe-core/playwright";
import type { Page, Request, Route } from "@playwright/test";
import { expect, test } from "../fixtures";

// The Performance workspace (plan/phase-08-plan.md, steps 2 to 5; the boards "Performance" on three sizes and
// "Performance, states"): the header, the KPIs and the summary equal the run's answer at the precision shown; an option
// pressed is chosen at once without a run; before a system voltage the API's words and no energy; a run on its way dims
// the values of before; a run that failed leaves them with a note. Every number is read from the run's answer.

const RUN = 90_000;
/** The pause before a run, twice over: after it, a run that was to come has been asked for. */
const LONGER_THAN_THE_PAUSE = 1_000;

type Energy = {
  energy_mwh: number;
  pr: number;
  specific_yield: number;
  cuf_ac_pct: number;
  cuf_dc_pct: number;
  poa_kwh_m2: number;
  total_25_years_mwh: number;
  co2_t: number;
  sigma_pct: number;
  p_values: { level: number; mwh: number }[];
};
type Option = { key: string; letter: string; caption: string; ok: boolean; n_series: number; n_strings: number; n_inverters: number; energy: Energy; summary: { label: string; value: string }[] };
type Weather = { source: "pvgis" | "nasa" | "csv"; label: string; hours: number; t_min_c: number; t_max_c: number; horizon_highest_deg: number | null };
type Answer = { options: Option[]; chosen_option: string | null; no_options: { title: string; message: string } | null; readouts: { positions: number }; weather: Weather };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const ran = (page: Page) => page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
/** A number as the page shows it: fixed decimals, a comma between thousands. */
const fixed = (value: number, decimals: number) => value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const isPhone = (projectName: string) => projectName === "phone";

const energyTile = (page: Page) => page.getByTestId("kpi-energy");
const optionSwitch = (page: Page) => page.getByTestId("option-switch");
const radio = (page: Page, letter: string) => optionSwitch(page).getByRole("radio", { name: new RegExp(`^${letter}\\b`) });
const workspaces = (page: Page) => page.getByRole("navigation", { name: "Workspaces" }).filter({ visible: true });
/** The trigger of the weather select: its label and the source's name. */
const weatherSelect = (page: Page) => page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ });

const SOURCE = { pvgis: "PVGIS", nasa: "NASA POWER", csv: "CSV" };

/** The line under the title, in the board's words, from the run's answer (decision 2). */
function lineOf(answer: Answer): string {
  const { weather } = answer;
  const option = answer.options.find((one) => one.key === answer.chosen_option);
  const first = option
    ? `${option.n_series} modules in series × ${option.n_strings} strings on ${option.n_inverters === 1 ? "1 inverter" : `${option.n_inverters} inverters`}`
    : `${fixed(answer.readouts.positions, 0)} positions ready`;
  const horizon = weather.horizon_highest_deg === null ? "no horizon" : `horizon up to ${fixed(weather.horizon_highest_deg, 1)}°`;
  return `${first} · ${fixed(weather.hours, 0)} hours of ${SOURCE[weather.source]} weather, ${fixed(weather.t_min_c, 1)} to ${fixed(weather.t_max_c, 1)} °C, ${horizon}`;
}

async function thePerformancePage(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/performance");
  const answer = await resultOf(await first);
  await expect(energyTile(page)).toContainText(fixed(chosenOf(answer).energy.energy_mwh, 1), { timeout: RUN });
  return answer;
}

/** Another option chosen: on desktop and tablet by its radio, on phone from the select. */
async function choose(page: Page, projectName: string, option: Option): Promise<void> {
  if (!isPhone(projectName)) return radio(page, option.letter).click();
  await optionSwitch(page).getByRole("button", { name: /^Option/ }).click();
  await page.getByRole("listbox", { name: "Option" }).getByRole("option", { name: new RegExp(`^${option.letter}\\b`) }).click();
}

/**
 * The demo with a system voltage of 1000 V chosen in the Strings lens, the run that follows answered by `design`;
 * then Performance, reached through the workspaces, so that the design that is open stays open. Gives the first run's
 * answer, and the request of the run that follows the voltage.
 */
async function aVoltageChangedThenPerformance(page: Page, design: (route: Route) => void): Promise<{ before: Answer; next: Promise<Request> }> {
  const first = ran(page);
  await page.goto("/studio/strings");
  const before = await resultOf(await first);
  await expect(page.getByTestId("option-card").filter({ visible: true }).first()).toBeVisible({ timeout: RUN });
  await page.route("**/api/design", design);
  const next = ran(page);
  await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();
  await workspaces(page).getByRole("link", { name: "Performance" }).click();
  await expect(page).toHaveURL(/\/performance$/);
  return { before, next };
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the header", () => {
  test("the line of the run is the run's; the options are its, the chosen one with its caption, each with its mark; the weather select its label", async ({ page }, testInfo) => {
    const answer = await thePerformancePage(page);
    const chosen = chosenOf(answer);

    await expect(page.getByTestId("run-line")).toHaveText(lineOf(answer));
    await expect(weatherSelect(page)).toHaveText(`Weather${answer.weather.label}`);
    if (isPhone(testInfo.project.name)) {
      const trigger = optionSwitch(page).getByRole("button", { name: /^Option/ });
      await expect(trigger).toContainText(`${chosen.letter} · ${chosen.caption}`);
      await expect(trigger.getByRole("img", { name: chosen.ok ? "In target" : /target/ })).toBeVisible();
      return;
    }
    const radios = optionSwitch(page).getByRole("radio");
    await expect(radios).toHaveCount(answer.options.length);
    for (const [index, option] of answer.options.entries()) {
      const shown = radios.nth(index);
      await expect(shown).toContainText(option.letter);
      await expect(shown).toHaveAttribute("aria-checked", String(option.key === answer.chosen_option));
      if (option.key === answer.chosen_option) await expect(shown).toContainText(option.caption);
      await expect(shown.getByRole("img", { name: option.ok ? "In target" : /the DC\/AC target/ })).toBeVisible();
    }
  });

  test("an option pressed is chosen at once, from the run's answer: the KPIs and the line follow, and nothing is asked", async ({ page }, testInfo) => {
    const answer = await thePerformancePage(page);
    const b = answer.options[1]!;
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(request.url());
    });

    await choose(page, testInfo.project.name, b);

    await expect(energyTile(page)).toContainText(fixed(b.energy.energy_mwh, 1));
    await expect(page.getByTestId("run-line")).toHaveText(lineOf({ ...answer, chosen_option: b.key }));
    if (isPhone(testInfo.project.name)) {
      await expect(optionSwitch(page).getByRole("button", { name: /^Option/ })).toContainText(`${b.letter} · ${b.caption}`);
    } else {
      await expect(radio(page, b.letter)).toHaveAttribute("aria-checked", "true");
      await expect(radio(page, b.letter)).toContainText(b.caption);
    }
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(asked).toEqual([]);
  });
});

test.describe("the KPIs and the summary", () => {
  test("every tile equals the chosen option's figure at the precision shown", async ({ page }) => {
    const answer = await thePerformancePage(page);
    const { energy } = chosenOf(answer);

    await expect(energyTile(page)).toContainText("Energy to grid, year 1");
    await expect(energyTile(page)).toContainText(`${fixed(energy.energy_mwh, 1)} MWh`);
    const cells = page.getByTestId("p-value");
    await expect(cells).toHaveCount(energy.p_values.length);
    for (const [index, { level, mwh }] of energy.p_values.entries()) {
      await expect(cells.nth(index)).toContainText(`P${level}`);
      await expect(cells.nth(index)).toContainText(fixed(mwh, 1));
    }
    await expect(cells.last()).toContainText(`σ ${fixed(energy.sigma_pct, 2)} %`);
    await expect(page.getByTestId("kpi-pr")).toContainText(`${fixed(energy.pr * 100, 1)} %`);
    await expect(page.getByTestId("kpi-yield")).toContainText(`${fixed(energy.specific_yield, 0)} kWh/kWp`);
    await expect(page.getByTestId("kpi-capacity-factor")).toContainText(`${fixed(energy.cuf_ac_pct, 1)} %`);
    await expect(page.getByTestId("kpi-capacity-factor")).toContainText(`${fixed(energy.cuf_dc_pct, 1)} % DC`);
    await expect(page.getByTestId("kpi-in-plane")).toContainText(`${fixed(energy.poa_kwh_m2, 0)} kWh/m²`);
    await expect(page.getByTestId("kpi-25-years")).toContainText(`${fixed(energy.total_25_years_mwh, 0)} MWh`);
    await expect(page.getByTestId("kpi-co2")).toContainText(`${fixed(energy.co2_t, 1)} t/yr`);
  });

  test("the summary rows equal the run's, in the engine's words", async ({ page }) => {
    const answer = await thePerformancePage(page);
    const { summary } = chosenOf(answer);
    const table = page.getByTestId("summary-table");

    expect(summary.length).toBeGreaterThan(0);
    for (const row of summary) {
      await expect(table).toContainText(row.label);
      await expect(table).toContainText(row.value);
    }
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    await thePerformancePage(page);
    const found = await new AxeBuilder({ page }).analyze();
    const grave = found.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);

    expect(grave).toEqual([]);
  });
});

test.describe("before a system voltage", () => {
  /** The demo as the API hands it out, with its system voltage left out: the engine's reason, in its words. */
  async function withoutAVoltage(page: Page): Promise<Answer> {
    await page.route("**/api/demo", async (route) => {
      const answer = await route.fetch();
      const demo: Record<string, unknown> = await answer.json();
      await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
    });
    const first = ran(page);
    await page.goto("/performance");
    const answer = await resultOf(await first);
    expect(answer.options).toEqual([]);
    return answer;
  }

  test("the API's title and message lead to the Strings lens; the line counts the positions; nothing of energy anywhere", async ({ page }) => {
    const answer = await withoutAVoltage(page);
    const waits = page.getByTestId("energy-waits");

    await expect(waits).toContainText(answer.no_options!.title, { timeout: RUN });
    await expect(waits).toContainText(answer.no_options!.message);
    await expect(waits.getByRole("link", { name: "Open the Strings lens" })).toHaveAttribute("href", "/studio/strings");
    await expect(page.getByTestId("run-line")).toHaveText(lineOf(answer));
    await expect(weatherSelect(page)).toContainText(answer.weather.label);
    await expect(optionSwitch(page)).toHaveCount(0);
    await expect(energyTile(page)).toHaveCount(0);
    await expect(page.getByTestId("summary-table")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("MWh");
    await expect(page.locator("body")).not.toContainText("kWh/kWp");
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    const answer = await withoutAVoltage(page);
    await expect(page.getByTestId("energy-waits")).toContainText(answer.no_options!.title, { timeout: RUN });
    const found = await new AxeBuilder({ page }).analyze();
    const grave = found.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);

    expect(grave).toEqual([]);
  });
});

test.describe("the states", () => {
  test("a run on its way: the values of before stand dimmed, the ring beside the energy, the engine's step under the title; then the new values", async ({ page }) => {
    let held: Route | null = null;
    const { before, next } = await aVoltageChangedThenPerformance(page, (route) => {
      held = route;
    });
    const energyOfBefore = fixed(chosenOf(before).energy.energy_mwh, 1);

    await expect(page.getByTestId("run-step")).toContainText("Updating energy", { timeout: RUN });
    await expect(energyTile(page)).toContainText(energyOfBefore);
    await expect(energyTile(page).getByTestId("stat-value").first()).toHaveClass(/opacity-updating/);
    await expect(energyTile(page).locator("svg.turning")).toHaveCount(1);
    await expect.poll(() => held !== null, { timeout: RUN }).toBe(true);
    await page.unroute("**/api/design");
    await (held as unknown as Route).continue();

    const after = await resultOf(await next);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(after).energy.energy_mwh, 1), { timeout: RUN });
    await expect(page.getByTestId("run-step")).toHaveCount(0);
    await expect(energyTile(page).getByTestId("stat-value").first()).not.toHaveClass(/opacity-updating/);
  });

  test("a run that failed: the values of before stay, not dimmed, with the note and Try again; Try again runs again", async ({ page }) => {
    const { before } = await aVoltageChangedThenPerformance(page, (route) => route.abort("connectionrefused"));
    const energyOfBefore = fixed(chosenOf(before).energy.energy_mwh, 1);
    const failed = page.getByTestId("run-failed");

    await expect(failed).toContainText("Energy was not updated", { timeout: RUN });
    await expect(failed).toContainText("Values are of the design before");
    await expect(energyTile(page)).toContainText(energyOfBefore);
    await expect(energyTile(page).getByTestId("stat-value").first()).not.toHaveClass(/opacity-updating/);
    await expect(page.getByTestId("run-line")).toHaveText(lineOf(before));

    await page.unroute("**/api/design");
    const again = ran(page);
    await failed.getByRole("button", { name: "Try again" }).click();
    const after = await resultOf(await again);
    await expect(energyTile(page)).toContainText(fixed(chosenOf(after).energy.energy_mwh, 1), { timeout: RUN });
    await expect(failed).toHaveCount(0);
  });
});
