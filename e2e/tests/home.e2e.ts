import AxeBuilder from "@axe-core/playwright";
import type { Download, Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { DEMO_ROOF_WORDS, TWO_DESIGNS, withDesignsOnTheDevice, type SeededDesign } from "../device";
import { A_MAP, roofMap, scaleLabel, searchField } from "../find";
import { expect, test } from "../fixtures";

// Home (plan/phase-10-plan.md, step 11, decision 5; the boards "Home" on three sizes): the headline, the search with Find my
// roof, the two rows, the demo's card and "On this device" with its words; Open the demo leads to the Studio in one press from
// a cold start with one run; coordinates typed and Find my roof lead to Find with the map at the roof; the rows open their
// dialogs; the demo's card shows the capacity and the energy only once the demo has run here, and then the run's own. The
// cards of the designs kept on this device (step 12, decisions 6 and 7): a design kept after an edit stands with its name, the
// roof's words, the capacity and the energy of the run and "Edited just now"; a card opens its design; Rename in place changes
// the card and the kept design; Duplicate makes "Copy of …" and opens it; Save a copy downloads the .rtd; Delete asks and
// removes. The tile of a card is the plan of the kept layout (step 13, decision 6): the module rows once a layout has come,
// the roof alone before. Every number and every word is read from the API's answers or the device's own records.

const RUN = 90_000;
const DEMO_NAME = "Pune demo roof";
const APPEAR_HERE = "Designs you save appear here. Nothing leaves this browser until you export.";
const RUNS_IN_THE_STUDIO = "Capacity and energy come with the run in the Studio";

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";

/** A third design for the cards: before a system voltage is chosen, so that its card says what waits. */
const WITHOUT_A_VOLTAGE: SeededDesign = { id: "warehouse-7", name: "Warehouse 7", dcKwp: null, energyMwh: null, roofWords: DEMO_ROOF_WORDS, editedAt: Date.UTC(2026, 8, 22, 10), withoutAVoltage: true };

const demoCard = (page: Page) => page.getByRole("article", { name: "Demo project" });
const onThisDevice = (page: Page) => page.getByRole("region", { name: "On this device" });
const findMyRoof = (page: Page) => page.getByRole("link", { name: "Find my roof" }).or(page.getByRole("button", { name: "Find my roof" }));
const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).locator('button[aria-haspopup="menu"]');
const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });
const cards = (page: Page) => onThisDevice(page).getByTestId("design-card");
const card = (page: Page, name: string) => onThisDevice(page).getByRole("article", { name, exact: true });
const roofType = (page: Page) => page.getByRole("radiogroup", { name: "Roof type" }).filter({ visible: true });
const menu = (page: Page, name: string) => page.getByRole("menu", { name, exact: true });

/** The menu of the card of *name* opened, and its row *row* taken. */
async function fromTheMenu(page: Page, name: string, row: string): Promise<void> {
  // The card in view first, as a reader has it: a scroll of the page closes the menu.
  await card(page, name).scrollIntoViewIfNeeded();
  await card(page, name).getByRole("button", { name: "Menu" }).click();
  await expect(menu(page, name)).toBeVisible();
  // The row's name begins with its words; Save a copy carries ".rtd" after them.
  await menu(page, name).getByRole("menuitem", { name: new RegExp(`^${row}`) }).click();
}

/** Home with the designs written to the device and their cards shown. */
async function homeWithDesigns(page: Page, designs: SeededDesign[]): Promise<void> {
  await withDesignsOnTheDevice(page, designs, null);
  await page.reload();
  await expect(page.getByTestId("demo-name")).toHaveText(DEMO_NAME);
  await expect(cards(page)).toHaveCount(designs.length);
}

/** The value of a stat as it is shown, its spaces made one. */
const shown = async (stat: ReturnType<Page["getByTestId"]>) => (await stat.innerText()).replace(/\s+/g, " ").trim();

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

test.describe("the cards of the designs on this device", () => {
  test("the demo edited in the Studio is kept; back on Home its card stands with its name, the roof's words, the capacity and the energy of the run, Edited just now", async ({ page }) => {
    await page.goto("/studio/roof");
    await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
    const ran = page.waitForResponse((response) => response.url().endsWith("/api/design") && response.request().postDataJSON().roof.roof_type === "flat_ew", { timeout: RUN });
    await roofType(page).getByRole("radio", { name: "East-west" }).click();
    await ran;
    await expect(vitals(page).getByText("MWh")).toBeVisible({ timeout: RUN });
    const energy = await shown(vitals(page).getByTestId("stat-value").filter({ hasText: "MWh" }).first());
    const capacity = await shown(vitals(page).getByTestId("stat-value").filter({ hasText: "kWp" }).first());
    // The facts of the run are written to the device after it lands: the switcher's row shows the capacity once they are.
    await switcher(page).click();
    await expect(page.getByRole("menu", { name: "On this device" }).getByRole("menuitem").first()).toContainText(/kWp$/, { timeout: RUN });
    await page.keyboard.press("Escape");

    await homeOpened(page);

    await expect(cards(page)).toHaveCount(1);
    const kept = card(page, DEMO_NAME);
    await expect(kept).toContainText("90.0 × 40.0 m flat roof, east-west");
    await expect(kept.getByTestId("stat-value").filter({ hasText: "kWp" })).toHaveText(capacity);
    await expect(kept.getByTestId("stat-value").filter({ hasText: "MWh" })).toHaveText(energy);
    await expect(kept).toContainText("Edited just now");
    // The tile is the plan of the kept layout: the roof, the tank and the module rows of the run that landed.
    const plan = kept.getByRole("button", { name: `Open ${DEMO_NAME}` }).locator("svg");
    await expect(plan).toHaveAttribute("viewBox", /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/);
    await expect(plan.locator('[data-part="roof"]')).toHaveCount(1);
    await expect(plan.locator('[data-part="obstacle"]')).toHaveCount(6);
    expect(await plan.locator("[data-module]").count()).toBeGreaterThan(100);
    await expect(onThisDevice(page)).toContainText("Nothing leaves this browser until you export.");
    await expect(onThisDevice(page)).not.toContainText("Designs you save appear here.");
  });

  test("a card: its tile and its name open the design in the Studio, run again; a design before a voltage says what waits, one not run says so", async ({ page }) => {
    await homeWithDesigns(page, [...TWO_DESIGNS, WITHOUT_A_VOLTAGE]);
    const runs = requestsTo(page, "/api/design");
    await expect(cards(page).nth(0)).toHaveAttribute("aria-label", DEMO_NAME);
    await expect(card(page, DEMO_NAME)).toContainText("Edited 24 Sep 2026");
    await expect(card(page, "Block B").getByTestId("card-waiting")).toHaveText("Not run yet");
    await expect(card(page, "Warehouse 7").getByTestId("card-waiting")).toHaveText("Waiting for a system voltage");
    await expect(card(page, "Block B").getByText("kWp")).toHaveCount(0);
    // A record kept without a thumbnail shows the plan of its roof alone: no layout has come for it here.
    const plan = card(page, "Block B").getByRole("button", { name: "Open Block B" }).locator("svg");
    await expect(plan.locator('[data-part="roof"]')).toHaveCount(1);
    await expect(plan.locator("[data-module]")).toHaveCount(0);

    await card(page, "Block B").getByRole("button", { name: "Block B", exact: true }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/);
    await expect(switcher(page)).toContainText("Block B", { timeout: RUN });
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(1);

    await homeOpened(page);
    await card(page, DEMO_NAME).getByRole("button", { name: `Open ${DEMO_NAME}` }).click();
    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });
  });

  test("Rename in place: the field takes the name, Enter commits it to the card and the kept design, Escape gives it back, an empty name is refused", async ({ page }) => {
    await homeWithDesigns(page, TWO_DESIGNS);

    await fromTheMenu(page, "Block B", "Rename");
    const field = onThisDevice(page).getByRole("textbox", { name: "Name" });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("Block B");
    await field.fill("   ");
    await field.press("Enter");
    await expect(onThisDevice(page).getByRole("status").filter({ hasText: "A name is needed" })).toBeVisible();
    await expect(field).toHaveValue("Block B");

    await field.fill("Block B, east wing");
    await field.press("Enter");

    await expect(card(page, "Block B, east wing")).toBeVisible();
    await expect(onThisDevice(page).getByRole("textbox", { name: "Name" })).toHaveCount(0);
    await expect(card(page, "Block B, east wing").getByRole("button", { name: "Block B, east wing", exact: true })).toBeVisible();

    await fromTheMenu(page, "Block B, east wing", "Rename");
    await onThisDevice(page).getByRole("textbox", { name: "Name" }).fill("Something else");
    await page.keyboard.press("Escape");
    await expect(onThisDevice(page).getByRole("textbox", { name: "Name" })).toHaveCount(0);
    await expect(card(page, "Block B, east wing")).toBeVisible();

    // The kept design carries the name: a reload lists it, and opened it is the design's name in the top bar.
    await page.reload();
    await expect(card(page, "Block B, east wing")).toBeVisible();
    await card(page, "Block B, east wing").getByRole("button", { name: "Block B, east wing", exact: true }).click();
    await expect(switcher(page)).toContainText("Block B, east wing", { timeout: RUN });
  });

  test("Duplicate makes Copy of the design, kept under its own id and opened at once; back on Home it stands first", async ({ page }) => {
    await homeWithDesigns(page, TWO_DESIGNS);

    await fromTheMenu(page, DEMO_NAME, "Duplicate");

    await expect(page).toHaveURL(/\/studio\/roof$/);
    await expect(switcher(page)).toContainText(`Copy of ${DEMO_NAME}`, { timeout: RUN });

    await homeOpened(page);
    await expect(cards(page)).toHaveCount(3);
    await expect(cards(page).nth(0)).toHaveAttribute("aria-label", `Copy of ${DEMO_NAME}`);
    await expect(card(page, DEMO_NAME)).toBeVisible();
  });

  test("desktop: Save a copy downloads the .rtd the API writes of that design, named after it, without opening it", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (plan/phase-09-plan.md, decision 15).");
    await homeWithDesigns(page, TWO_DESIGNS);
    const download: Promise<Download> = page.waitForEvent("download");

    await fromTheMenu(page, "Block B", "Save a copy");

    const file = await download;
    expect(file.suggestedFilename()).toBe("Block-B.rtd");
    const written = JSON.parse(readFileSync((await file.path())!, "utf8")) as { name: string; format: number };
    expect(written).toMatchObject({ name: "Block B", format: 2 });
    await expect(page).toHaveURL(/\/$/);
  });

  test("Delete asks in the board's words; Cancel keeps the design; Delete removes it from the device and the page", async ({ page }) => {
    await homeWithDesigns(page, TWO_DESIGNS);

    await fromTheMenu(page, "Block B", "Delete");

    const dialog = page.getByRole("dialog", { name: "Delete Block B?" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("It is kept on this device alone.");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(cards(page)).toHaveCount(2);

    await fromTheMenu(page, "Block B", "Delete");
    await dialog.getByRole("button", { name: "Delete" }).click();

    await expect(dialog).toBeHidden();
    await expect(cards(page)).toHaveCount(1);
    await expect(card(page, DEMO_NAME)).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("demo-name")).toHaveText(DEMO_NAME);
    await expect(cards(page)).toHaveCount(1);

    await fromTheMenu(page, DEMO_NAME, "Delete");
    await page.getByRole("dialog", { name: `Delete ${DEMO_NAME}?` }).getByRole("button", { name: "Delete" }).click();
    await expect(cards(page)).toHaveCount(0);
    await expect(onThisDevice(page)).toContainText(APPEAR_HERE);
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical on Home without a design kept", async ({ page }) => {
    await homeOpened(page);

    expect(await graveFindings(page)).toEqual([]);
  });

  test("finds nothing serious or critical on Home with two designs kept, and with a card's menu open", async ({ page }) => {
    await homeWithDesigns(page, TWO_DESIGNS);

    expect(await graveFindings(page)).toEqual([]);

    await card(page, DEMO_NAME).scrollIntoViewIfNeeded();
    await card(page, DEMO_NAME).getByRole("button", { name: "Menu" }).click();
    await expect(menu(page, DEMO_NAME)).toBeVisible();
    expect(await graveFindings(page)).toEqual([]);
  });
});
