import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, Request } from "@playwright/test";
import { expect, test } from "../fixtures";

// The charts of Performance (plan/phase-08-plan.md, steps 13 and 14; the boards "Energy to grid by month", "25 years" and
// "Charts, tooltip and table"): the bars, their labels and the table of the months equal the run's answer at the precision
// shown; the tooltip under the pointer and under a finger; the six years, their table and the total; the degradation
// entered asks one run and no layout, and the years follow. Every number is read from the run's answer.

const RUN = 90_000;
/** The pause before a run, twice over: after it, a run that was to come has been asked for. */
const LONGER_THAN_THE_PAUSE = 1_000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LABELLED_YEARS = [1, 5, 10, 15, 20, 25];

type Energy = { energy_mwh: number; dc_kwp: number; specific_yield: number; monthly_mwh: number[]; years_mwh: number[]; total_25_years_mwh: number };
type Option = { key: string; energy: Energy };
type Answer = { options: Option[]; chosen_option: string | null };

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
const energyOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!.energy;
/** A month's kWh/kWp as the page shows it: its MWh times a thousand over the DC capacity, whole. */
const yieldOf = (energy: Energy, month: number) => fixed((energy.monthly_mwh[month]! * 1000) / energy.dc_kwp, 0);
const isPhone = (projectName: string) => projectName === "phone";

const monthly = (page: Page) => page.getByTestId("monthly-chart");
const years = (page: Page) => page.getByTestId("years-chart");
const bars = (page: Page) => monthly(page).getByTestId("month-bar");
const plot = (page: Page) => years(page).getByTestId("years-plot");
/** The tooltip of a value that is shown: a popover that is closed is not seen. */
const tooltip = (page: Page) => page.getByTestId("value-tooltip").filter({ visible: true });
/** The rows of a table: on phone each is a card. */
const rows = (card: Locator, projectName: string) => (isPhone(projectName) ? card.getByRole("listitem") : card.getByRole("row").filter({ has: card.page().getByRole("rowheader") }));

async function thePerformancePage(page: Page): Promise<Energy> {
  const first = ran(page);
  await page.goto("/performance");
  const energy = energyOf(await resultOf(await first));
  await expect(bars(page)).toHaveCount(12, { timeout: RUN });
  return energy;
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the energy to grid by month", () => {
  test("twelve bars, each named with its MWh and kWh/kWp; the highest and the lowest labelled and no other; the months under", async ({ page }) => {
    const energy = await thePerformancePage(page);
    const { monthly_mwh } = energy;
    const highest = Math.max(...monthly_mwh);
    const lowest = Math.min(...monthly_mwh);

    for (const [index, mwh] of monthly_mwh.entries()) {
      await expect(bars(page).nth(index)).toHaveAttribute("aria-label", `${MONTHS[index]}: ${fixed(mwh, 1)} MWh, ${yieldOf(energy, index)} kWh/kWp`);
    }
    const labels = monthly(page).getByTestId("bar-label");
    await expect(labels).toHaveCount(2);
    await expect(labels).toHaveText(monthly_mwh.filter((mwh) => mwh === highest || mwh === lowest).map((mwh) => fixed(mwh, 1)));
    await expect(monthly(page)).toContainText("MWh");
    for (const month of MONTHS) await expect(monthly(page)).toContainText(month);
  });

  test("the Table tab: the twelve months with MWh and kWh/kWp, and the year as the run's energy and specific yield", async ({ page }, testInfo) => {
    const energy = await thePerformancePage(page);

    await monthly(page).getByRole("tab", { name: "Table" }).click();

    const shown = rows(monthly(page), testInfo.project.name);
    await expect(shown).toHaveCount(13);
    for (const [index, mwh] of energy.monthly_mwh.entries()) {
      await expect(shown.nth(index)).toContainText(MONTHS[index]!);
      await expect(shown.nth(index)).toContainText(fixed(mwh, 1));
      await expect(shown.nth(index)).toContainText(yieldOf(energy, index));
    }
    await expect(shown.last()).toContainText("Year");
    await expect(shown.last()).toContainText(fixed(energy.energy_mwh, 1));
    await expect(shown.last()).toContainText(fixed(energy.specific_yield, 0));
    await expect(bars(page)).toHaveCount(0);
  });

  test("under the pointer, or under a finger, a bar says its value then its month; the label of an extreme gives way", async ({ page }, testInfo) => {
    const energy = await thePerformancePage(page);
    const highest = energy.monthly_mwh.indexOf(Math.max(...energy.monthly_mwh));
    const bar = bars(page).nth(highest);

    if (testInfo.project.use.hasTouch) await bar.tap();
    else await bar.hover();

    await expect(tooltip(page)).toHaveCount(1);
    await expect(tooltip(page)).toContainText(`${fixed(energy.monthly_mwh[highest]!, 1)} MWh · ${yieldOf(energy, highest)} kWh/kWp`);
    await expect(tooltip(page)).toContainText(MONTHS[highest]!);
    await expect(monthly(page).getByTestId("bar-label")).toHaveCount(1);

    if (testInfo.project.use.hasTouch) await bar.tap();
    else await page.mouse.move(0, 0);
    await expect(tooltip(page)).toHaveCount(0);
    await expect(monthly(page).getByTestId("bar-label")).toHaveCount(2);
  });

  test("the keyboard reaches every bar, and the focus shows the same as the pointer", async ({ page }) => {
    const energy = await thePerformancePage(page);

    await monthly(page).getByRole("tab", { name: "Chart" }).focus();
    await page.keyboard.press("Tab");
    await expect(monthly(page).getByRole("tabpanel")).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await expect(bars(page).nth(1)).toBeFocused();
    await expect(tooltip(page)).toContainText(`${fixed(energy.monthly_mwh[1]!, 1)} MWh · ${yieldOf(energy, 1)} kWh/kWp`);
    await expect(tooltip(page)).toContainText("Feb");
    await page.keyboard.press("Escape");
    await expect(tooltip(page)).toHaveCount(0);
  });
});

test.describe("the 25 years", () => {
  test("the six years under the line, and the Table tab with six years and the total, equal the run's", async ({ page }, testInfo) => {
    const energy = await thePerformancePage(page);
    const labels = years(page).getByTestId("year-label");

    await expect(labels).toHaveCount(6);
    for (const [index, year] of LABELLED_YEARS.entries()) {
      await expect(labels.nth(index)).toContainText(year === 1 ? "Year 1" : String(year));
      await expect(labels.nth(index).getByTestId("year-value")).toHaveText(fixed(energy.years_mwh[year - 1]!, 1));
    }

    await years(page).getByRole("tab", { name: "Table" }).click();

    const shown = rows(years(page), testInfo.project.name);
    await expect(shown).toHaveCount(7);
    for (const [index, year] of LABELLED_YEARS.entries()) {
      await expect(shown.nth(index)).toContainText(`Year ${year}`);
      await expect(shown.nth(index)).toContainText(fixed(energy.years_mwh[year - 1]!, 1));
    }
    await expect(shown.last()).toContainText("Total, 25 years");
    await expect(shown.last()).toContainText(fixed(energy.total_25_years_mwh, 0));
  });

  test("under the pointer, or under a finger, the crosshair snaps to the nearest year and the tooltip says its energy", async ({ page }, testInfo) => {
    const energy = await thePerformancePage(page);
    // On tablet and phone the plot lies below the window: the finger and the pointer must reach it.
    await plot(page).scrollIntoViewIfNeeded();
    const box = (await plot(page).boundingBox())!;
    const at = { x: box.x + (box.width * 9) / 24, y: box.y + box.height / 2 };

    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(at.x, at.y);
    else await page.mouse.move(at.x, at.y);

    await expect(plot(page).getByTestId("crosshair")).toHaveCount(1);
    await expect(plot(page).getByTestId("marker")).toHaveCount(1);
    await expect(tooltip(page)).toContainText(`${fixed(energy.years_mwh[9]!, 1)} MWh`);
    await expect(tooltip(page)).toContainText("Year 10");
    await expect(plot(page).getByRole("slider")).toHaveAttribute("aria-valuenow", "10");
  });

  test("the plot takes the keyboard focus and the arrows move the year", async ({ page }) => {
    const energy = await thePerformancePage(page);
    const slider = plot(page).getByRole("slider");

    // The focus must not scroll the page: a page that moves takes the tooltip away.
    await plot(page).scrollIntoViewIfNeeded();
    await years(page).getByRole("tab", { name: "Chart" }).focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    await expect(slider).toBeFocused();
    await expect(slider).toHaveAttribute("aria-valuetext", `Year 1: ${fixed(energy.years_mwh[0]!, 1)} MWh`);
    await expect(tooltip(page)).toContainText("Year 1");
    for (let step = 0; step < 4; step += 1) await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveAttribute("aria-valuetext", `Year 5: ${fixed(energy.years_mwh[4]!, 1)} MWh`);
    await expect(tooltip(page)).toContainText(`${fixed(energy.years_mwh[4]!, 1)} MWh`);
    await page.keyboard.press("End");
    await expect(slider).toHaveAttribute("aria-valuenow", "25");
    await page.keyboard.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "1");
  });

  test("a degradation of 0.70 entered: one run and no layout; the years and the total change, year 1 does not", async ({ page }, testInfo) => {
    const before = await thePerformancePage(page);
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(request.url());
    });
    const field = years(page).getByRole("textbox", { name: "Degradation" });
    const next = ran(page);

    await field.fill("0.70");
    await field.press("Enter");

    const after = energyOf(await resultOf(await next));
    expect(after.years_mwh[0]).toBeCloseTo(before.years_mwh[0]!, 6);
    expect(after.years_mwh[24]).not.toBeCloseTo(before.years_mwh[24]!, 1);
    expect(fixed(after.total_25_years_mwh, 0)).not.toBe(fixed(before.total_25_years_mwh, 0));
    await expect(field).toHaveValue("0.70");
    const values = years(page).getByTestId("year-value");
    await expect(values.last()).toHaveText(fixed(after.years_mwh[24]!, 1), { timeout: RUN });
    await expect(values.first()).toHaveText(fixed(after.years_mwh[0]!, 1));
    await expect(page.getByTestId("kpi-25-years")).toContainText(`${fixed(after.total_25_years_mwh, 0)} MWh`);
    await years(page).getByRole("tab", { name: "Table" }).click();
    await expect(rows(years(page), testInfo.project.name).last()).toContainText(fixed(after.total_25_years_mwh, 0));
    await page.waitForTimeout(LONGER_THAN_THE_PAUSE);
    expect(asked.filter((url) => url.endsWith("/api/design"))).toHaveLength(1);
    expect(asked.filter((url) => url.endsWith("/api/layout"))).toEqual([]);
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical with the Chart tabs, nor with the Table tabs", async ({ page }) => {
    await thePerformancePage(page);
    expect(await grave(page)).toEqual([]);

    await monthly(page).getByRole("tab", { name: "Table" }).click();
    await years(page).getByRole("tab", { name: "Table" }).click();
    await expect(bars(page)).toHaveCount(0);
    expect(await grave(page)).toEqual([]);
  });
});
