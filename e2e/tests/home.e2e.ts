import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { A_MAP, roofMap, scaleLabel, searchField } from "../find";
import { expect, test } from "../fixtures";

// Home (plan/phase-10-plan.md, step 11, decision 5; the boards "Home" on three sizes): the headline, the search with Find my
// roof, the two rows, the demo's card and "On this device" with its words; Open the demo leads to the Studio in one press from
// a cold start with one run; coordinates typed and Find my roof lead to Find with the map at the roof; the rows open their
// dialogs; the demo's card shows the capacity and the energy only once the demo has run here, and then the run's own.
// Every number and every word is read from the API's answers.

const RUN = 90_000;
const DEMO_NAME = "Pune demo roof";
const APPEAR_HERE = "Designs you save appear here. Nothing leaves this browser until you export.";
const RUNS_IN_THE_STUDIO = "Capacity and energy come with the run in the Studio";

const isPhone = (projectName: string) => projectName === "phone";

const demoCard = (page: Page) => page.getByRole("article", { name: "Demo project" });
const onThisDevice = (page: Page) => page.getByRole("region", { name: "On this device" });
const findMyRoof = (page: Page) => page.getByRole("link", { name: "Find my roof" }).or(page.getByRole("button", { name: "Find my roof" }));
const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).locator('button[aria-haspopup="menu"]');
const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });

const requestsTo = (page: Page, ending: string) => {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(ending)) seen.push(request.url());
  });
  return seen;
};

/** Home with the demo's card read from the API. */
async function homeOpened(page: Page): Promise<void> {
  expect((await page.goto("/"))?.status()).toBe(200);
  await expect(page.getByTestId("demo-name")).toHaveText(DEMO_NAME);
}

async function graveFindings(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the page", () => {
  test("the headline, the search with Find my roof, the two rows, the demo's card with its name and roof, and On this device with its words; no horizontal scroll", async ({ page }, testInfo) => {
    await homeOpened(page);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Find your roof\.\s*Design it in 3D\./);
    await expect(page.getByText("Search the map, outline your roof, and get layout, shading, stringing and 8,760-hour energy yield on one live model.")).toBeVisible();
    await expect(page.getByRole("img", { name: "SolarLayout Rooftop" })).toBeVisible();
    await expect(searchField(page)).toBeVisible();
    await expect(page.getByRole("link", { name: "Find my roof" })).toHaveAttribute("href", "/find");
    await expect(page.getByRole("button", { name: "Import a drawing" })).toContainText("KMZ, KML or DXF with the roof and its obstacles");
    await expect(page.getByRole("button", { name: "Open a project" })).toContainText("A saved .rtd file, from this device or a colleague");
    await expect(demoCard(page)).toContainText("Demo project");
    await expect(demoCard(page)).toContainText("90.0 × 40.0 m flat roof, tilted rows");
    await expect(demoCard(page).getByRole("button", { name: "Open the demo" })).toBeVisible();
    await expect(onThisDevice(page)).toContainText("On this device");
    await expect(onThisDevice(page)).toContainText(APPEAR_HERE);
    // The 3D illustration is for the eye only, and the phone has none.
    const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(width.scroll, "no horizontal scroll").toBeLessThanOrEqual(width.client);
    if (isPhone(testInfo.project.name)) await expect(page.getByTestId("demo-card")).toBeVisible();
  });

  test("the demo is read for its card, and nothing is opened: no design run on Home", async ({ page }) => {
    const asked: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/")) asked.push(new URL(request.url()).pathname);
    });

    await homeOpened(page);

    expect(asked).toEqual(["/api/demo"]);
  });
});

test.describe("the demo", () => {
  test("a cold start: the card has no numbers but says why; Open the demo opens the Studio with the demo's name in one press, with one run and no second request for the demo", async ({ page }) => {
    const demos = requestsTo(page, "/api/demo");
    const runs = requestsTo(page, "/api/design");
    await homeOpened(page);
    await expect(demoCard(page)).toContainText(RUNS_IN_THE_STUDIO);
    await expect(demoCard(page).getByText("kWp")).toHaveCount(0);

    await demoCard(page).getByRole("button", { name: "Open the demo" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/);
    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });
    await expect(vitals(page).getByText("MWh")).toBeVisible({ timeout: RUN });
    expect(demos).toHaveLength(1);
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(1);
  });

  test("once the demo has run here, back on Home its card shows the run's capacity and energy, as the vitals say them", async ({ page }) => {
    await homeOpened(page);
    await demoCard(page).getByRole("button", { name: "Open the demo" }).click();
    await expect(vitals(page).getByText("MWh")).toBeVisible({ timeout: RUN });
    const energy = (await vitals(page).getByTestId("stat-value").filter({ hasText: "MWh" }).first().innerText()).replace(/\s+/g, " ").trim();
    const capacity = (await vitals(page).getByTestId("stat-value").filter({ hasText: "kWp" }).first().innerText()).replace(/\s+/g, " ").trim();

    await homeOpened(page);

    await expect(demoCard(page).getByTestId("stat-value").filter({ hasText: "kWp" })).toHaveText(capacity);
    await expect(demoCard(page).getByTestId("stat-value").filter({ hasText: "MWh" })).toHaveText(energy);
    await expect(demoCard(page)).not.toContainText(RUNS_IN_THE_STUDIO);
  });
});

test.describe("the ways to a design", () => {
  test("coordinates typed and Find my roof: Find opens with the map at the roof, the place found", async ({ page }, testInfo) => {
    await homeOpened(page);

    await searchField(page).fill("18.52000, 73.86000");
    await findMyRoof(page).click();

    await expect(page).toHaveURL(/\/find\?at=18\.52%2C73\.86$/);
    await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    await expect(page.getByRole("heading", { level: 1, name: "Outline the roof" })).toBeVisible();
    if (isPhone(testInfo.project.name)) {
      await expect(page.getByText("Step 2 of 3")).toBeVisible();
    } else {
      await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });
      await expect(page.getByTestId("found-at")).toHaveText("18.52000° N, 73.86000° E");
    }
  });

  test("nothing typed: Find my roof is a link to Find, as before", async ({ page }) => {
    await homeOpened(page);

    await page.getByRole("link", { name: "Find my roof" }).click();

    await expect(page).toHaveURL(/\/find$/);
    await expect(page.getByRole("heading", { level: 1, name: "Find the roof" })).toBeVisible();
  });

  test("Import a drawing opens its dialog; Open a project opens its dialog", async ({ page }) => {
    await homeOpened(page);

    await page.getByRole("button", { name: "Import a drawing" }).click();
    const importDialog = page.getByRole("dialog", { name: "Import a drawing" });
    await expect(importDialog).toBeVisible();
    await expect(importDialog.getByRole("button", { name: "Open the roof" })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await expect(importDialog).toBeHidden();

    await page.getByRole("button", { name: "Open a project" }).click();
    const openDialog = page.getByRole("dialog", { name: "Open a project" });
    await expect(openDialog).toBeVisible();
    await expect(openDialog.getByRole("button", { name: "Open", exact: true })).toHaveAttribute("aria-disabled", "true");
    await page.keyboard.press("Escape");
    await expect(openDialog).toBeHidden();
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical on Home without a design kept", async ({ page }) => {
    await homeOpened(page);

    expect(await graveFindings(page)).toEqual([]);
  });
});
