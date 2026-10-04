import type { Page, Route } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "../fixtures";
import { expectScreen, expectWholeScreen, topBarSettled, vitals } from "../screens";

// The pictures of Performance, each against its baseline in e2e/baselines (performance*.png: the performance group's own,
// tools/check/e2e-groups.ts). After a change that is meant, look at the new picture beside the preview in
// docs/design/previews, then renew the baseline:
//   bun tools/with-node.ts playwright test performance-screens --update-snapshots   (in e2e/)

// Performance with the demo from the API of the test stack. A picture is taken once the result is there.
const RUN = 90_000;
test.describe.configure({ timeout: RUN + 30_000 });

// Performance with the demo (the board "Performance" on three sizes): the header, the KPIs and the summary of option A.
test("performance", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);

  await expectWholeScreen(page, "performance");
});

// Soiling 3 % landed (the board "Loss chain, edited"): the chain of the new run, the field holding 3.0.
test("performance, the chain with soiling 3 % landed", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.soiling_pct === 3, { timeout: RUN });
  const soiling = page.getByTestId("loss-chain").getByRole("textbox", { name: "Soiling" });
  await soiling.fill("3");
  await soiling.press("Enter");
  const events = (await (await (await ran).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
  const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
  await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN });
  // No focus ring and no readout in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);

  await expectWholeScreen(page, "performance-chain-edited");
});

// The Table tab of the months (the board "Charts, tooltip and table"): twelve rows and the year, beside the 25 years.
test("performance, the months as a table", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const chart = page.getByTestId("monthly-chart");
  await chart.getByRole("tab", { name: "Table" }).click();
  await expect(chart.getByRole("tabpanel", { name: "Table" })).toBeVisible();
  // No focus ring in the picture.
  await chart.getByRole("tab", { name: "Table" }).blur();

  await expectWholeScreen(page, "performance-month-table");
});

// Degradation 0.70 %/yr entered and landed (the same board): year 1 unchanged, the other years and the total of that run,
// the field with the focus still inside it.
test("performance, the degradation entered", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const field = page.getByTestId("years-chart").getByRole("textbox", { name: "Degradation" });
  const next = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
  await field.fill("0.70");
  await field.press("Enter");
  await next;
  await expect(page.getByTestId("years-chart").getByTestId("year-value").last()).toHaveText("522.0", { timeout: RUN });
  await expect(page.getByTestId("run-step")).toHaveCount(0);

  await expectWholeScreen(page, "performance-years-degraded");
});

// Before a system voltage (the board "Performance, states"): the API's words in place of the KPIs, no energy.
test("performance, before a system voltage", async ({ page }) => {
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo: Record<string, unknown> = await answer.json();
    await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
  });
  await page.goto("/performance");
  await expect(page.getByTestId("energy-waits")).toContainText("Choose a system voltage to size the strings", { timeout: RUN });

  await expectWholeScreen(page, "performance-no-voltage");
});

/**
 * A system voltage of 1000 V chosen in the Strings lens with the run that follows answered by `design`, then
 * Performance reached through the workspaces, so that the design that is open stays open.
 */
const aVoltageChangedThenPerformance = async (page: Page, design: (route: Route) => void) => {
  await page.goto("/studio/strings");
  await expect(vitals(page).getByText("617.8")).toBeVisible({ timeout: RUN });
  await expect(page.getByTestId("option-card").filter({ visible: true }).first()).toBeVisible({ timeout: RUN });
  await page.route("**/api/design", design);
  await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();
  await page.getByRole("navigation", { name: "Workspaces" }).filter({ visible: true }).getByRole("link", { name: "Performance" }).click();
  await expect(page).toHaveURL(/\/performance$/);
  // No focus ring in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
};

// A run on its way (the same board): the values of before dimmed, the ring beside the energy, the step under the title.
test("performance, a run on its way", async ({ page }) => {
  await aVoltageChangedThenPerformance(page, () => {
    // Held: the run stays on its way for the picture.
  });
  await expect(page.getByTestId("run-step")).toContainText("Updating energy", { timeout: RUN });

  await expectWholeScreen(page, "performance-updating");
});

// A run that failed (the same board): the values of before, not dimmed, the note with Try again and the API's words.
test("performance, the run failed", async ({ page }) => {
  const NO_WEATHER = { error: { code: "weather_not_loaded", message: "This project has no weather for 18.5200, 73.8600 yet. Load the PVGIS TMY weather first.", field: "weather_json" } };
  await aVoltageChangedThenPerformance(page, (route) => route.fulfill({ status: 422, json: NO_WEATHER }));
  await expect(page.getByTestId("run-failed")).toContainText("Energy was not updated", { timeout: RUN });

  await expectWholeScreen(page, "performance-failed");
});

// NASA POWER 2023 landed (the board "Weather and assumptions"): the line says no horizon, the KPIs are of the run on it.
test("performance, NASA POWER landed", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().weather_source === "nasa", { timeout: RUN });
  await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
  await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^NASA POWER 2023/ }).click();
  const events = (await (await (await ran).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
  const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
  await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN * 2 });
  await expect(page.getByTestId("run-step")).toHaveCount(0);
  // No focus ring in the picture.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectWholeScreen(page, "performance-weather-nasa");
});

// The CSV dialog with a file of GHI alone read (the same board): the file's card with the API's summary and its three notes.
test("performance, the CSV dialog with a file read", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const fixture = JSON.parse(readFileSync(path.resolve(__dirname, "../fixtures/weather-pvgis-pune.json"), "utf8")) as { weather: { time: string[]; ghi: number[] } };
  const csv = ["time,ghi", ...fixture.weather.time.map((time, hour) => `${time},${fixture.weather.ghi[hour]}`)].join("\n");
  await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
  await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^CSV file/ }).click();
  const dialog = page.getByRole("dialog", { name: "Load weather from a CSV" });
  await dialog.locator("input[type=file]").setInputFiles({ name: "pune-ghi.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(dialog.getByTestId("csv-note")).toHaveCount(3, { timeout: RUN });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectScreen(page, "performance-csv-dialog");
});

// A download that failed (the same board): the API's words under the select, PVGIS TMY still the source.
test("performance, a weather that was not loaded", async ({ page }, testInfo) => {
  const OVER_THE_SEA = {
    error: {
      code: "no_weather_for_site",
      message: "PVGIS TMY has no weather for 10.0000, 65.0000: Location over the sea. Please, select another location. Check the site, or choose another weather source.",
      field: null,
    },
  };
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  await page.route("**/api/weather", (route) => route.fulfill({ status: 422, json: OVER_THE_SEA }));
  await page.getByTestId("weather-select").getByRole("button", { name: /^Weather/ }).click();
  await page.getByRole("listbox", { name: "Weather" }).getByRole("option", { name: /^NASA POWER 2023/ }).click();
  await expect(page.getByTestId("weather-failed")).toContainText("The weather was not loaded");
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectWholeScreen(page, "performance-weather-failed");
});

// Uc 25 and the levels 50, 90, 99 landed (the same board): the lead tile with P50 · P90 · P99, the field holding 25 with "Use the roof type's".
test("performance, the assumptions entered", async ({ page }, testInfo) => {
  await page.goto("/performance");
  await expect(page.getByTestId("kpi-energy").getByText("617.8 MWh")).toBeVisible({ timeout: RUN });
  await topBarSettled(page, testInfo.project.name);
  const assumptions = page.getByTestId("assumptions");
  const withUc = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.uc === 25, { timeout: RUN });
  const uc = assumptions.getByRole("textbox", { name: "Thermal Uc" });
  await uc.fill("25");
  await uc.press("Enter");
  await withUc;
  const withLevels = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().losses.p_levels.join() === "50,90,99", { timeout: RUN });
  const level = assumptions.getByRole("textbox", { name: "Exceedance level 2" });
  await level.fill("99");
  await level.press("Enter");
  const events = (await (await (await withLevels).response())!.text()).split("\n").filter((line) => line.startsWith("data:"));
  const { result } = JSON.parse(events[events.length - 1]!.slice(5)) as { result: { options: { energy: { energy_mwh: number } }[] } };
  await expect(page.getByTestId("kpi-energy").getByText(`${result.options[0]!.energy.energy_mwh.toFixed(1)} MWh`)).toBeVisible({ timeout: RUN });
  await expect(page.getByTestId("p-value").last()).toContainText("P99");
  await expect(page.getByTestId("run-step")).toHaveCount(0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await expectWholeScreen(page, "performance-assumptions-entered");
});
