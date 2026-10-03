import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../fixtures";
import { asFile, asFormat1, demoProjectFile } from "../project-file";

// Open a project (plan/phase-10-plan.md, steps 9 and 10, decision 4): the switcher's row opens the dialog on three sizes;
// a project file of this app opens as a new design kept on this device, run once, listed under On this device, and
// found again by a reload; a format 1 file of the desktop app opens with the engine's note as a toast, word for word; a
// file that is no .rtd is refused in the dialog's own words without a request; a text that is not JSON and a format
// this version does not read are refused under the field in the API's words, and the design that is open stays. Every
// word of the API and of the engine is the one the API answers.

const RUN = 90_000;
const DEMO_NAME = "Pune demo roof";
const OPENED_NAME = "Block B";
const PAN_NOTE = "The module file Test.PAN (PAN) is not included in this project. Choose it again.";
const NOT_JSON = "The file is not a project file (.rtd): it is not JSON.";
const FORMAT_3 = "This project file is format 3. This version reads formats 1 and 2. Open it with a newer version of the app.";
const NOT_AN_RTD = "Choose a project file (.rtd).";
const NOT_LOADED = "This file was not loaded";

const isDesktop = (projectName: string) => projectName === "desktop";

const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).getByRole("button", { name: new RegExp(`^(${DEMO_NAME}|${OPENED_NAME})`) });
const onThisDevice = (page: Page) => page.getByRole("menu", { name: "On this device" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Open a project" });
const openButton = (page: Page) => dialog(page).getByRole("button", { name: "Open", exact: true });
const fileInput = (page: Page) => dialog(page).locator("input[type=file]");
const drop = (page: Page) => dialog(page).getByTestId("file-drop");
const refused = (page: Page) => dialog(page).getByTestId("open-refused");
const toast = (page: Page) => page.getByTestId("toast");

/** The state of saving where the size says it: the top bar on desktop, the switcher on tablet and phone (opened here). */
async function stateOfSaving(page: Page, projectName: string): Promise<Locator> {
  if (isDesktop(projectName)) return bar(page).getByTestId("save-state").and(page.locator('[data-look="bar"]'));
  if ((await switcher(page).getAttribute("aria-expanded")) !== "true") await switcher(page).click();
  return page.getByTestId("project-menu").getByTestId("this-design").getByTestId("save-state");
}

/** The Studio open on the Roof lens with the demo. */
async function theRoofLens(page: Page): Promise<void> {
  await page.goto("/studio/roof");
  await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
}

/** The project switcher opened and Open a project taken: the dialog stands. */
async function dialogOpened(page: Page): Promise<void> {
  await switcher(page).click();
  await page.getByRole("menu", { name: "Project" }).getByRole("menuitem", { name: "Open a project" }).click();
  await expect(dialog(page)).toBeVisible();
}

const requestsTo = (page: Page, ending: string) => {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith(ending)) seen.push(request.url());
  });
  return seen;
};

async function graveFindings(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("the dialog", () => {
  test("opens from the switcher's row with its words and Open waiting; Escape closes it, Cancel closes it", async ({ page }) => {
    await theRoofLens(page);

    await dialogOpened(page);

    await expect(switcher(page)).toHaveAttribute("aria-expanded", "false");
    await expect(dialog(page)).toContainText("A project saved by this app or the desktop app. It opens in the Studio and runs again here.");
    await expect(drop(page)).toContainText("Drop the project file here");
    await expect(drop(page)).toContainText("An .rtd file saved by this app or the desktop app");
    await expect(drop(page).getByRole("button", { name: "Choose a file" })).toBeVisible();
    await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(dialog(page).getByRole("button", { name: "Cancel" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();

    await dialogOpened(page);
    await dialog(page).getByRole("button", { name: "Cancel" }).click();
    await expect(dialog(page)).toBeHidden();
    await expect(switcher(page)).toContainText(DEMO_NAME);
  });
});

test.describe("a project file of this app", () => {
  test("opens as a new design kept on this device: the top bar shows its name, one run, listed under On this device; a reload opens it again", async ({ page }, testInfo) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), name: OPENED_NAME };
    const runs = requestsTo(page, "/api/design");
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify(file)));

    await expect(drop(page).locator("code", { hasText: "Block-B.rtd" })).toBeVisible();
    await expect(drop(page)).toContainText(/Project file · (\d+ KB|\d+\.\d MB) · read when it is opened/);
    await expect(drop(page).getByRole("button", { name: "Choose another" })).toBeVisible();
    await expect(openButton(page)).not.toHaveAttribute("aria-disabled", "true");

    await openButton(page).click();

    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(page).toHaveURL(/\/studio\/roof$/);
    await expect(switcher(page)).toContainText(OPENED_NAME, { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(1);
    if (isDesktop(testInfo.project.name)) await switcher(page).click();
    await expect(onThisDevice(page).getByRole("menuitem")).toHaveCount(1);
    await expect(onThisDevice(page).getByRole("menuitem").first()).toContainText(OPENED_NAME);
    await expect(onThisDevice(page).getByRole("menuitem").first()).toHaveAttribute("aria-current", "true");
    await page.keyboard.press("Escape");
    await expect(switcher(page)).toHaveAttribute("aria-expanded", "false");
    await expect(toast(page)).toHaveCount(0);

    await page.reload();

    await expect(switcher(page)).toContainText(OPENED_NAME, { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand", { timeout: RUN });
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    await expect.poll(() => runs.length, { timeout: RUN }).toBe(2);
  });
});

test.describe("a format 1 file of the desktop app", () => {
  test("opens with the engine's note on the module file as a toast, word for word, and the design is kept", async ({ page }, testInfo) => {
    await theRoofLens(page);
    const file = asFormat1(await demoProjectFile(page));
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Test-project.rtd", JSON.stringify(file)));
    await openButton(page).click();

    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(toast(page)).toHaveCount(1);
    await expect(toast(page)).toContainText(PAN_NOTE);
    await expect(toast(page).getByText(PAN_NOTE, { exact: true })).toBeVisible();
    await expect(toast(page).getByRole("button", { name: "Close" })).toBeVisible();
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
    if (!isDesktop(testInfo.project.name)) await page.keyboard.press("Escape");

    // The toast stays until it is closed.
    await toast(page).getByRole("button", { name: "Close" }).click();
    await expect(toast(page)).toHaveCount(0);
  });
});

test.describe("a file that is refused", () => {
  test("a .txt is refused in the field, in the dialog's own words, without a request", async ({ page }) => {
    await theRoofLens(page);
    const opens = requestsTo(page, "/api/project/open");
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("roof-notes.txt", "The tank is 2.4 m high.\n"));

    await expect(drop(page)).toContainText(NOT_LOADED);
    await expect(drop(page)).toContainText(NOT_AN_RTD);
    await expect(drop(page).getByRole("button", { name: "Choose another" })).toBeVisible();
    await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
    expect(opens).toEqual([]);
  });

  test("a text that is not JSON is refused under the field in the API's words; the file stays chosen, the design that is open stays", async ({ page }) => {
    await theRoofLens(page);
    const runs = requestsTo(page, "/api/design");
    const opens = requestsTo(page, "/api/project/open");
    await dialogOpened(page);
    await fileInput(page).setInputFiles(asFile("notes.rtd", "PVObject_=pvModule\n  Version=7.2\n"));
    await expect(openButton(page)).not.toHaveAttribute("aria-disabled", "true");

    await openButton(page).click();

    await expect(refused(page)).toContainText(NOT_LOADED);
    await expect(refused(page).getByText(NOT_JSON, { exact: true })).toBeVisible();
    await expect(refused(page).getByRole("button", { name: "Try again" })).toHaveCount(0);
    await expect(drop(page).locator("code", { hasText: "notes.rtd" })).toBeVisible();
    await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(dialog(page)).toBeVisible();
    expect(opens).toHaveLength(1);
    expect(runs).toEqual([]);
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await expect(toast(page)).toHaveCount(0);

    // Another file chosen takes the refusal away and Open is live again.
    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify({ ...(await demoProjectFile(page)), name: OPENED_NAME })));
    await expect(refused(page)).toHaveCount(0);
    await expect(openButton(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("a format this version does not read is refused in the engine's sentence", async ({ page }) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), format: 3 };
    await dialogOpened(page);
    await fileInput(page).setInputFiles(asFile("Warehouse-7.rtd", JSON.stringify(file)));

    await openButton(page).click();

    await expect(refused(page).getByText(FORMAT_3, { exact: true })).toBeVisible();
    await expect(drop(page).locator("code", { hasText: "Warehouse-7.rtd" })).toBeVisible();
    await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
    await expect(switcher(page)).toContainText(DEMO_NAME);
  });

  test("an API that cannot be reached is said under the field with Try again, which sends the same file again", async ({ page }) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), name: OPENED_NAME };
    let failed = 0;
    await page.route("**/api/project/open", (route) => {
      failed += 1;
      return route.abort("connectionrefused");
    });
    await dialogOpened(page);
    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify(file)));

    await openButton(page).click();

    await expect(refused(page)).toContainText("The server cannot be reached. Check the connection and try again.");
    await expect(drop(page).locator("code", { hasText: "Block-B.rtd" })).toBeVisible();
    expect(failed).toBe(1);
    await page.unroute("**/api/project/open");

    await refused(page).getByRole("button", { name: "Try again" }).click();

    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(switcher(page)).toContainText(OPENED_NAME, { timeout: RUN });
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical with the dialog open over a file chosen", async ({ page }) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), name: OPENED_NAME };
    await dialogOpened(page);
    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify(file)));
    await expect(openButton(page)).not.toHaveAttribute("aria-disabled", "true");

    expect(await graveFindings(page)).toEqual([]);
  });
});
