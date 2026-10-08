import AxeBuilder from "@axe-core/playwright";
import type { Dialog, Locator, Page } from "@playwright/test";
import { DEMO_ROOF_WORDS, keptDesignsOf, TWO_DESIGNS, withDesignsOnTheDevice, withTheDesignsRemoved } from "../device";
import { A_MAP, atTheRoof, drawTheRectangle, roofMap } from "../find";
import { expect, test } from "../fixtures";

// The designs kept on this device (plan/phase-10-plan.md, steps 1 to 6, decisions 1 to 3): the demo is not kept until it
// is edited; an edit says Saving then Saved on this device; a reload opens the same design with its edit and asks the
// energy once again; a second design built by hand is kept at its first edit and the switcher lists both, newest first,
// a press opening the other; a device emptied gives the demo back; a download on its way asks before the page is left.
// Every number and every word is read from the API's answers or the device's own records.

const RUN = 90_000;
const DEMO_NAME = "Pune demo roof";
/** A roof built by hand without a name is the API's "Untitled roof" (D49). */
const BUILT_NAME = "Untitled roof";

const isDesktop = (projectName: string) => projectName === "desktop";

const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).getByRole("button", { name: new RegExp(`^(${DEMO_NAME}|${BUILT_NAME})`) });
const menu = (page: Page) => page.getByTestId("project-menu");
const thisDesign = (page: Page) => menu(page).getByTestId("this-design");
const onThisDevice = (page: Page) => page.getByRole("menu", { name: "On this device" });
const roofType = (page: Page) => page.getByRole("radiogroup", { name: "Roof type" }).filter({ visible: true });
const vitals = (page: Page) => page.getByRole("region", { name: "Design vitals" });

/** The state of saving where the size says it: the top bar on desktop, the switcher on tablet and phone (opened here). */
async function stateOfSaving(page: Page, projectName: string): Promise<Locator> {
  if (isDesktop(projectName)) return bar(page).getByTestId("save-state").and(page.locator('[data-look="bar"]'));
  if ((await switcher(page).getAttribute("aria-expanded")) !== "true") await switcher(page).click();
  return thisDesign(page).getByTestId("save-state");
}

async function closed(page: Page): Promise<void> {
  if ((await switcher(page).getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
  await expect(switcher(page)).toHaveAttribute("aria-expanded", "false");
}

/** The Studio open on the Roof lens with the demo, its roof type shown. */
async function theRoofLens(page: Page): Promise<void> {
  await page.goto("/studio/roof");
  await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
}

/** The words of the top bar's state of saving, each change once, from now on: Saving is too brief to be waited for. */
async function wordsOfSavingSeen(page: Page): Promise<void> {
  await page.evaluate(() => {
    const seen: string[] = [];
    const header = document.querySelector("header")!;
    const record = () => {
      const words = header.querySelector('[data-testid="save-state"][data-look="bar"]')?.textContent ?? "";
      if (seen.at(-1) !== words) seen.push(words);
    };
    record();
    new MutationObserver(record).observe(header, { childList: true, subtree: true, characterData: true });
    (window as unknown as { __savingSeen: string[] }).__savingSeen = seen;
  });
}

const savingSeen = (page: Page) => page.evaluate(() => (window as unknown as { __savingSeen: string[] }).__savingSeen);

const designRuns = (page: Page) => {
  const runs: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/design")) runs.push(request.url());
  });
  return runs;
};
const demosAsked = (page: Page) => {
  const demos: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/demo")) demos.push(request.url());
  });
  return demos;
};

/** The roof type set to East-west: the first committed edit, which keeps the design (D32). */
async function editedToEastWest(page: Page): Promise<void> {
  await roofType(page).getByRole("radio", { name: "East-west" }).click();
  await expect(roofType(page).getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true");
}

async function graveFindings(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the demo", () => {
  test("opened, it says Not kept on this device: in the top bar on desktop, in the switcher on tablet and phone", async ({ page }, testInfo) => {
    await theRoofLens(page);

    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Not kept on this device");
    if (isDesktop(testInfo.project.name)) {
      await switcher(page).click();
      await expect(thisDesign(page)).toContainText("Not kept on this device");
    }
    await expect(menu(page).getByText("Designs you save appear here.")).toBeVisible();
    await expect(onThisDevice(page)).toHaveCount(0);
  });

  test("edited, it says Saving then Saved on this device, and stands under On this device", async ({ page }, testInfo) => {
    await theRoofLens(page);
    await wordsOfSavingSeen(page);

    await editedToEastWest(page);

    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    expect(await savingSeen(page)).toEqual(["Not kept on this device", "Saving", "Saved on this device"]);
    if (isDesktop(testInfo.project.name)) await switcher(page).click();
    await expect(onThisDevice(page).getByRole("menuitem")).toHaveCount(1);
    await expect(onThisDevice(page).getByRole("menuitem").first()).toContainText(DEMO_NAME);
    await expect(onThisDevice(page).getByRole("menuitem").first()).toHaveAttribute("aria-current", "true");
    await expect(menu(page).getByText("Designs you save appear here.")).toHaveCount(0);
  });
});

test.describe("a reload", () => {
  test("opens the same design with its edit, and asks the energy once again, not the demo", async ({ page }, testInfo) => {
    await theRoofLens(page);
    await editedToEastWest(page);
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await closed(page);
    const runs = designRuns(page);
    const demos = demosAsked(page);

    await page.reload();

    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });
    await expect(roofType(page).getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(1);
    expect(demos).toEqual([]);
    // The energy comes again from the run of the kept document.
    await expect(vitals(page).getByText("MWh")).toBeVisible({ timeout: RUN });
  });

  test("with the designs removed from the device (the id still remembered) opens the demo untouched, and says it is not kept", async ({ page }, testInfo) => {
    await theRoofLens(page);
    await editedToEastWest(page);
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await closed(page);
    const demos = demosAsked(page);
    await withTheDesignsRemoved(page);

    await page.reload();

    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });
    await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Not kept on this device");
    expect(demos).toHaveLength(1);
    // A design removed on purpose needs no word; the id remembered is forgotten with the demo.
    await expect(page.getByTestId("toast")).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("rooftop.open-design"))).toBeNull();
  });
});

test.describe("two designs", () => {
  test("a second design built by hand is kept at its first edit; the switcher lists both, newest first; a press opens the other and the top bar's name follows", async ({ page }, testInfo) => {
    test.setTimeout(A_MAP + RUN * 4);
    // The demo kept, and the facts of its run written once it lands (the capacity at the right of its row).
    await theRoofLens(page);
    await wordsOfSavingSeen(page);
    const ran = page.waitForResponse((response) => response.url().endsWith("/api/design") && response.request().postDataJSON().roof.roof_type === "flat_ew", { timeout: RUN });
    await editedToEastWest(page);
    await ran;
    // The edit, the layout and the run each write the record; writes that follow within the debounce are one span of Saving.
    await expect.poll(() => savingSeen(page), { timeout: RUN }).toContain("Saving");
    await expect.poll(async () => (await savingSeen(page)).at(-1), { timeout: RUN }).toBe("Saved on this device");
    expect((await savingSeen(page))[0]).toBe("Not kept on this device");
    // The run's facts reach the device 600 ms after the run lands (the debounce), after the words above may already
    // say Saved for the layout's write: the page is left only once the demo's card has its capacity.
    await expect.poll(async () => (await keptDesignsOf(page)).find((one) => one.name === DEMO_NAME)?.facts.dcKwp ?? null, { timeout: RUN }).not.toBeNull();

    // A second design: a roof drawn on the map, built, not kept until its roof type is edited.
    await page.goto("/find");
    await expect(roofMap(page)).toHaveAttribute("data-state", "ready", { timeout: A_MAP });
    await atTheRoof(page);
    await drawTheRectangle(page);
    await page.getByRole("button", { name: "Build this roof" }).click();
    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    await expect(switcher(page)).toContainText(BUILT_NAME, { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Not kept on this device");
    await closed(page);
    await expect(roofType(page).getByRole("radio", { name: "Tilted rows" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
    await editedToEastWest(page);
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");

    if (isDesktop(testInfo.project.name)) await switcher(page).click();
    const rows = onThisDevice(page).getByRole("menuitem");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText(BUILT_NAME);
    await expect(rows.nth(0)).toHaveAttribute("aria-current", "true");
    // The design runs at the voltage of the country (D87): until its run with a chosen option lands the fact is the roof's words, then its kWp.
    await expect(rows.nth(0)).toContainText(/(m flat roof, east-west|\d kWp)$/);
    await expect(rows.nth(1)).toContainText(DEMO_NAME);
    await expect(rows.nth(1)).not.toHaveAttribute("aria-current", "true");
    await expect(rows.nth(1)).toContainText(/\d kWp$/);

    const runs = designRuns(page);
    await rows.nth(1).click();

    await expect(switcher(page)).toHaveAttribute("aria-expanded", "false");
    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });
    await expect(roofType(page).getByRole("radio", { name: "East-west" })).toHaveAttribute("aria-checked", "true", { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(1);
    if (isDesktop(testInfo.project.name)) await switcher(page).click();
    await expect(rows.nth(1)).toHaveAttribute("aria-current", "true");
    await expect(rows.nth(0)).not.toHaveAttribute("aria-current", "true");
  });
});

test.describe("the warning before leaving", () => {
  const downloadAll = (page: Page) => page.getByRole("button", { name: "Download all" });

  test("a download on its way: the browser asks before the page is left; at rest it asks nothing", async ({ page }) => {
    await page.goto("/handover");
    await expect(downloadAll(page)).not.toHaveAttribute("aria-disabled", "true", { timeout: RUN });
    const dialogs: Dialog[] = [];
    page.on("dialog", (dialog) => {
      dialogs.push(dialog);
      void dialog.accept();
    });
    await page.route("**/api/export/zip**", () => {
      // Held: the zip stays on its way.
    });

    await downloadAll(page).click();
    await expect(downloadAll(page)).toHaveAttribute("aria-disabled", "true");
    await page.reload();

    expect(dialogs.map((dialog) => dialog.type())).toEqual(["beforeunload"]);

    // After the reload nothing is on its way: no question.
    await expect(downloadAll(page)).not.toHaveAttribute("aria-disabled", "true", { timeout: RUN });
    await page.reload();
    await expect(downloadAll(page)).toBeVisible({ timeout: RUN });
    expect(dialogs).toHaveLength(1);
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical with the switcher open over two designs on this device", async ({ page }) => {
    await withDesignsOnTheDevice(page, TWO_DESIGNS, TWO_DESIGNS[0]!.id);
    await page.goto("/studio/array");
    await expect(switcher(page)).toContainText(DEMO_NAME, { timeout: RUN });

    await switcher(page).click();
    await expect(onThisDevice(page).getByRole("menuitem")).toHaveText([`${DEMO_NAME}357.28 kWp`, `Block B${DEMO_ROOF_WORDS}`]);

    expect(await graveFindings(page)).toEqual([]);
  });
});
