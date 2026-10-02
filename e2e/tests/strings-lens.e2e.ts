import type { Page, Request } from "@playwright/test";
import { A_MAP, atTheRoof, drawTheRectangle, roofMap } from "../find";
import { expect, test } from "../fixtures";
import { sceneSettled, switchLens } from "../stage";

// The Strings lens (plan/phase-07-plan.md, steps 3 to 6; the boards "Studio, Strings lens" on three sizes and
// "Studio, Strings lens, no system voltage yet"). The system voltage is never chosen for the user: a new design
// has none, and nothing of energy is shown anywhere until one is chosen (decisions 1 and 4); the demo shows
// the one its document holds. Every number is read from the run's answer.

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

const decision = (page: Page) => page.getByTestId("voltage-decision").filter({ visible: true });

/** A new design: the 90 by 40 roof outlined on the map and built; then its Strings lens with its first run over. */
async function aNewDesignInTheStringsLens(page: Page): Promise<void> {
  await page.goto("/find");
  await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
  await atTheRoof(page);
  await drawTheRectangle(page);
  await page.getByRole("button", { name: "Build this roof" }).click();
  await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
  await switchLens(page, "Strings");
  await expect(page.getByText("Shading for every module").filter({ visible: true })).toBeVisible({ timeout: RUN });
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("before a system voltage", () => {
  test("a new design has none: nothing is chosen, and no energy is shown anywhere", async ({ page }) => {
    await aNewDesignInTheStringsLens(page);

    await expect(decision(page).getByRole("heading", { name: "Choose a system voltage" })).toBeVisible();
    for (const volts of ["600 V", "1000 V", "1500 V"]) await expect(decision(page).getByRole("button", { name: volts })).toBeVisible();
    await expect(page.getByRole("radio", { checked: true }).filter({ hasText: / V$/ })).toHaveCount(0);
    await expect(page.getByText("Waiting for your choice").filter({ visible: true })).toBeVisible();
    await expect(page.getByText(/^Layout: \d[\d,]* positions$/).filter({ visible: true })).toBeVisible();
    await expect(page.locator("body")).not.toContainText("MWh");
    await expect(page.locator("body")).not.toContainText("kWh/kWp");

    await switchLens(page, "Sun");
    await expect(page.getByRole("region", { name: "Shading over the year" })).toContainText("Choose a system voltage to size the strings");
    await expect(page.locator("body")).not.toContainText("MWh");
  });

  test("a voltage pressed is the user's: the run is asked once after the pause, and the layout not at all", async ({ page }) => {
    await aNewDesignInTheStringsLens(page);
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(new URL(request.url()).pathname);
    });
    const run = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });

    await decision(page).getByRole("button", { name: "1500 V" }).click();

    expect((await run).postDataJSON().system_voltage).toBe(1500);
    await expect(page.getByRole("radiogroup", { name: "System voltage" }).filter({ visible: true }).getByRole("radio", { name: "1500 V" })).toBeChecked();
    await expect(page.getByText("Your choice").filter({ visible: true })).toBeVisible();
    await expect(decision(page)).toHaveCount(0);
    await expect.poll(() => asked, { timeout: RUN }).toEqual(["/api/design"]);
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

