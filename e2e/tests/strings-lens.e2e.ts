import type { Page, Request } from "@playwright/test";
import { A_MAP, atTheRoof, drawTheRectangle, roofMap } from "../find";
import { expect, test } from "../fixtures";
import { sceneSettled, switchLens } from "../stage";

// The Strings lens (plan/phase-07-plan.md, steps 3 to 6; the boards "Studio, Strings lens" on three sizes and "System
// voltage · Set by the user's country"). A new design gets the voltage of the user's country, set by the app (D87): 600 V
// in the United States and Canada, 1000 V elsewhere, found from the request, else the time zone, else India. A choice in
// the lens is the user's. The demo shows the one its document holds. Every number is read from the run's answer.

const RUN = 90_000;

type Answer = {
  equipment: { inverter: { model: string; manufacturer: string; pnom_kw: number; n_mppt: number; n_inputs: number }; max_current_per_mppt: { value_a: number | null } };
  series_range: { n_min: number; n_max: number } | null;
};

async function resultOf(request: Request): Promise<Answer> {
  const response = await request.response();
  const events = (await response!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const theVoltage = (page: Page) => page.getByTestId("system-voltage").filter({ visible: true });
const radio = (page: Page, volts: string) => page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: volts });

/**
 * A new design: the 90 by 40 roof outlined on the map and built; then its Strings lens with its first run over.
 * The roof has no weather: the flow loads it (plan/phase-08-plan.md, decision 11), answered from the fixture of
 * Pune (e2e/fixtures.ts). The API answers the roof without a voltage; the app gives it the country's as it opens it.
 */
async function aNewDesignInTheStringsLens(page: Page): Promise<void> {
  const built = page.waitForResponse((response) => response.url().endsWith("/api/roof/from-map"));
  await page.goto("/find");
  await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
  await atTheRoof(page);
  await drawTheRectangle(page);
  await page.getByRole("button", { name: "Build this roof" }).click();
  expect((await (await built).json()).system_voltage).toBeNull();
  await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
  await switchLens(page, "Strings");
  await expect(theVoltage(page)).toBeVisible({ timeout: RUN });
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("a new design in the time zone of India (D87)", () => {
  test.use({ timezoneId: "Asia/Calcutta" });

  test("gets 1000 V, set by the app, and is sized and run with no choice made", async ({ page }) => {
    const run = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().weather_json !== null, { timeout: RUN });
    await aNewDesignInTheStringsLens(page);

    expect((await run).postDataJSON()).toMatchObject({ system_voltage: 1000, system_voltage_by: "app" });
    await expect(radio(page, "1000 V")).toBeChecked();
    await expect(theVoltage(page)).toContainText("Set for India");
    await expect(theVoltage(page)).toContainText("the usual limit for rooftops in India");
    await expect(page.getByTestId("voltage-decision")).toHaveCount(0);
    await expect(page.getByTestId("strings-sized").filter({ visible: true })).toBeVisible({ timeout: RUN });
  });

  test("a voltage pressed is the user's: the run is asked once after the pause, and the layout not at all", async ({ page }) => {
    await aNewDesignInTheStringsLens(page);
    await expect(page.getByTestId("strings-sized").filter({ visible: true })).toBeVisible({ timeout: RUN });
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(new URL(request.url()).pathname);
    });
    const run = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });

    await radio(page, "1500 V").click();

    expect((await run).postDataJSON()).toMatchObject({ system_voltage: 1500, system_voltage_by: "user" });
    await expect(radio(page, "1500 V")).toBeChecked();
    await expect(theVoltage(page)).toContainText("Your choice");
    await expect.poll(() => asked, { timeout: RUN }).toEqual(["/api/design"]);
  });
});

test.describe("a new design in the United States (D87)", () => {
  test.use({ timezoneId: "America/New_York" });

  test("gets 600 V, the limit for homes; no length fits the demo's inverter under it, and 1000 V is offered", async ({ page }) => {
    await aNewDesignInTheStringsLens(page);

    await expect(radio(page, "600 V")).toBeChecked();
    await expect(theVoltage(page)).toContainText("Set for the United States");
    await expect(theVoltage(page)).toContainText("the limit for homes in the United States (NEC 690.7)");
    await expect(page.getByTestId("voltage-offer").filter({ visible: true })).toContainText("at 1000 V one does", { timeout: RUN });
  });

  test("the request's country comes before the time zone", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-vercel-ip-country": "DE" });
    await aNewDesignInTheStringsLens(page);

    await expect(radio(page, "1000 V")).toBeChecked();
    await expect(theVoltage(page)).toContainText("Set for Germany");
  });
});

test.describe("the demo", () => {
  test("shows the voltage its document holds, and the inverter the run read", async ({ page }) => {
    const ran = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
    await page.goto("/studio/strings");
    const answer = await resultOf(await ran);
    await sceneSettled(page);

    await expect(page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1500 V" })).toBeChecked();
    const card = page.getByTestId("inverter-card").filter({ visible: true });
    const { inverter, max_current_per_mppt: current } = answer.equipment;
    await expect(card.getByTestId("inverter-name")).toHaveText(inverter.model);
    await expect(card.getByTestId("inverter-line")).toHaveText(`${inverter.manufacturer} · ${inverter.pnom_kw} kW · ${inverter.n_mppt} MPPT`);
    await expect(card.getByTestId("inverter-facts")).toHaveText(`${current.value_a!.toFixed(1)} A per MPPT · ${inverter.n_inputs} inputs`);
  });

  test("at 1000 V the series range is the run's: its longest string is the run's n_max, its band and its verdict", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(page.getByTestId("series-verdict").filter({ visible: true })).toBeVisible({ timeout: RUN });
    const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().system_voltage === 1000, { timeout: RUN });

    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1000 V" }).click();

    const { series_range: range } = await resultOf(await ran);
    const section = page.getByTestId("series-range").filter({ visible: true });
    await expect(section).toContainText(`${range!.n_min} to ${range!.n_max} fit`, { timeout: RUN });
    await expect(section.getByTestId("series-end")).toHaveText([`${range!.n_min} · MPPT minimum`, `${range!.n_max} · Voc limit`]);
    await expect(section.getByTestId("series-band")).toBeVisible();
    await expect(section.getByTestId("series-verdict")).toBeVisible();
  });

  test("at 600 V no string length fits: no band, the engine's words, what can change it, and the vitals say it", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(page.getByTestId("series-verdict").filter({ visible: true })).toBeVisible({ timeout: RUN });
    const ran = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().system_voltage === 600, { timeout: RUN });

    await page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "600 V" }).click();

    const answer = (await resultOf(await ran)) as Answer & { no_options: { title: string; message: string } };
    const section = page.getByTestId("series-range").filter({ visible: true });
    await expect(section).toContainText("None fit", { timeout: RUN });
    await expect(section.getByTestId("series-band")).toHaveCount(0);
    await expect(section.getByTestId("series-verdict")).toContainText(answer.no_options.title);
    await expect(section.getByTestId("series-verdict")).toContainText(answer.no_options.message);
    await expect(page.getByTestId("nothing-fits").filter({ visible: true })).toHaveText("Change the system voltage, the inverter or the sizing temperatures");
    await expect(page.getByRole("region", { name: "Design vitals" })).toContainText(answer.no_options.title);
  });
});

test.describe("the sizing", () => {
  test("a Voc coefficient entered sizes the strings: the longest is the run's new n_max, the note goes; given back, it returns", async ({ page }) => {
    await page.goto("/studio/strings");
    await expect(page.getByTestId("series-verdict").filter({ visible: true })).toBeVisible({ timeout: RUN });
    const sizing = page.getByRole("region", { name: "Sizing temperatures" }).filter({ visible: true });
    await sizing.getByRole("button", { name: /Sizing temperatures/ }).click();
    await expect(sizing.getByTestId("voc-note")).toContainText("Check the datasheet and enter it if it differs.");
    const entered = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().voc_coefficient_pct === -0.29, { timeout: RUN });

    const field = sizing.getByRole("textbox", { name: "Voc coefficient" });
    await field.fill("-0.29");
    await field.press("Enter");

    const { series_range: range } = await resultOf(await entered);
    await expect(page.getByTestId("series-range").filter({ visible: true }).getByTestId("series-end").last()).toHaveText(`${range!.n_max} · Voc limit`, { timeout: RUN });
    await expect(sizing).toContainText("entered");
    await expect(sizing.getByTestId("voc-note")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Design vitals" })).not.toContainText("Voc coefficient");

    const givenBack = page.waitForRequest((request) => request.url().endsWith("/api/design") && request.postDataJSON().voc_coefficient_pct === null, { timeout: RUN });
    await sizing.getByRole("button", { name: "Use the module's" }).click();
    await givenBack;
    await expect(sizing.getByTestId("voc-note")).toBeVisible({ timeout: RUN });
  });
});

