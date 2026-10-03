import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, Route } from "@playwright/test";
import { expect, test } from "../fixtures";
import { asFile, asFormat1, demoProjectFile } from "../project-file";

// Open a project (plan/phase-10-plan.md, steps 9 and 10, decision 4; the board "Open a project"): the switcher's row opens
// the dialog on three sizes; a file is read through the API as soon as it is chosen, and the dialog shows what was read;
// Open keeps it on this device as a new design, run once, listed under On this device, and found again by a reload; a
// format 1 file of the desktop app shows the engine's notes as rows, word for word; a file that is no .rtd is refused in
// the dialog's own words without a request; a text that is not JSON and a format this version does not read are refused in
// the field in the API's words, and the design that is open stays; a second file chosen replaces the first, whatever the
// first's answer. Every word of the API and of the engine is the one the API answers.

const RUN = 90_000;
const DEMO_NAME = "Pune demo roof";
const OPENED_NAME = "Block B";
const RUNS_IN_THE_STUDIO = "Capacity and energy come with the run in the Studio";
const PAN_NOTE = "The module file Test.PAN (PAN) is not included in this project. Choose it again.";
const OND_NOTE = "The inverter file Test-S.ond (OND) is not included in this project. Choose it again.";
const NOT_JSON = "The file is not a project file (.rtd): it is not JSON.";
const FORMAT_3 = "This project file is format 3. This version reads formats 1 and 2. Open it with a newer version of the app.";
const NOT_AN_RTD = "Choose a project file (.rtd).";
const NOT_LOADED = "This file was not loaded";
const UNREACHABLE = "The server cannot be reached. Check the connection and try again.";

const isDesktop = (projectName: string) => projectName === "desktop";

const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).getByRole("button", { name: new RegExp(`^(${DEMO_NAME}|${OPENED_NAME})`) });
const onThisDevice = (page: Page) => page.getByRole("menu", { name: "On this device" });
const dialog = (page: Page) => page.getByRole("dialog", { name: "Open a project" });
const openButton = (page: Page) => dialog(page).getByRole("button", { name: "Open", exact: true });
const fileInput = (page: Page) => dialog(page).locator("input[type=file]");
const drop = (page: Page) => dialog(page).getByTestId("file-drop");
const lines = (page: Page) => dialog(page).getByTestId("file-drop-line");
const notes = (page: Page) => dialog(page).getByTestId("open-note");
const tryAgain = (page: Page) => dialog(page).getByRole("button", { name: "Try again" });
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

/** The file read: its name in mono, the project's name and the line under it, Open live. */
async function read(page: Page, file: string, name: string): Promise<void> {
  await expect(drop(page).locator("code", { hasText: file })).toBeVisible();
  await expect(lines(page)).toHaveText([name, RUNS_IN_THE_STUDIO]);
  await expect(drop(page).getByRole("button", { name: "Choose another" })).toBeVisible();
  await expect(openButton(page)).not.toHaveAttribute("aria-disabled", "true");
}

/** The file refused in the field, in these words, Open waiting. */
async function refused(page: Page, words: string): Promise<void> {
  await expect(drop(page)).toContainText(NOT_LOADED);
  await expect(drop(page).getByText(words, { exact: true })).toBeVisible();
  await expect(drop(page).getByRole("button", { name: "Choose another" })).toBeVisible();
  await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
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
  test("is read as soon as it is chosen; Open keeps it as a new design on this device without a second request: the top bar shows its name, one run, listed under On this device; a reload opens it again", async ({ page }, testInfo) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), name: OPENED_NAME };
    const runs = requestsTo(page, "/api/design");
    const opens = requestsTo(page, "/api/project/open");
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify(file)));

    await read(page, "Block-B.rtd", OPENED_NAME);
    expect(opens).toHaveLength(1);
    await expect(notes(page)).toHaveCount(0);
    await expect(switcher(page)).toContainText(DEMO_NAME);

    await openButton(page).click();

    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(page).toHaveURL(/\/studio\/roof$/);
    await expect(switcher(page)).toContainText(OPENED_NAME, { timeout: RUN });
    expect(opens).toHaveLength(1);
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

  test("a second file chosen replaces the first, whatever the first's answer: the dialog shows the second", async ({ page }) => {
    await theRoofLens(page);
    const demo = await demoProjectFile(page);
    const first = JSON.stringify({ ...demo, name: "First roof" });
    const second = JSON.stringify({ ...demo, name: "Second roof" });
    // The first file's answer is held back until the second has been read.
    let letTheFirstAnswer: (() => void) | null = null;
    const theFirstMayAnswer = new Promise<void>((resolve) => (letTheFirstAnswer = resolve));
    await page.route("**/api/project/open", async (route: Route) => {
      if ((route.request().postDataJSON() as { name: string }).name === "First.rtd") await theFirstMayAnswer;
      await route.continue();
    });
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("First.rtd", first));
    await expect(drop(page)).toContainText("Reading the file");
    await expect(openButton(page)).toHaveAttribute("aria-disabled", "true");
    await fileInput(page).setInputFiles(asFile("Second.rtd", second));

    await read(page, "Second.rtd", "Second roof");
    letTheFirstAnswer!();
    // The first's answer, late, changes nothing.
    await expect(lines(page)).toHaveText(["Second roof", RUNS_IN_THE_STUDIO]);
    await openButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(switcher(page)).toContainText("Second roof", { timeout: RUN });
  });
});

test.describe("a format 1 file of the desktop app", () => {
  test("is read with the engine's notes on the module and the inverter files as rows under the field, word for word; Open is live and keeps the design; no toast", async ({ page }, testInfo) => {
    await theRoofLens(page);
    const file = asFormat1(await demoProjectFile(page));
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Test-project.rtd", JSON.stringify(file)));

    await read(page, "Test-project.rtd", DEMO_NAME);
    await expect(notes(page)).toHaveText([PAN_NOTE, OND_NOTE]);
    await expect(notes(page).first().getByRole("img", { name: "Note" })).toBeVisible();

    await openButton(page).click();

    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(toast(page)).toHaveCount(0);
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await expect(await stateOfSaving(page, testInfo.project.name)).toHaveText("Saved on this device");
  });
});

test.describe("a file that is refused", () => {
  test("a .txt is refused in the field, in the dialog's own words, without a request", async ({ page }) => {
    await theRoofLens(page);
    const opens = requestsTo(page, "/api/project/open");
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("roof-notes.txt", "The tank is 2.4 m high.\n"));

    await refused(page, NOT_AN_RTD);
    expect(opens).toEqual([]);
  });

  test("a text that is not JSON is refused in the field in the API's words as soon as it is chosen; the design that is open stays; another file is read", async ({ page }) => {
    await theRoofLens(page);
    const runs = requestsTo(page, "/api/design");
    const opens = requestsTo(page, "/api/project/open");
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("notes.rtd", "PVObject_=pvModule\n  Version=7.2\n"));

    await refused(page, NOT_JSON);
    await expect(tryAgain(page)).toHaveCount(0);
    await expect(dialog(page)).toBeVisible();
    expect(opens).toHaveLength(1);
    expect(runs).toEqual([]);
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await expect(toast(page)).toHaveCount(0);

    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify({ ...(await demoProjectFile(page)), name: OPENED_NAME })));
    await read(page, "Block-B.rtd", OPENED_NAME);
  });

  test("a format this version does not read is refused in the engine's sentence", async ({ page }) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), format: 3 };
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Warehouse-7.rtd", JSON.stringify(file)));

    await refused(page, FORMAT_3);
    await expect(switcher(page)).toContainText(DEMO_NAME);
  });

  test("an API that cannot be reached is said in the field with Try again, which asks the read again", async ({ page }) => {
    await theRoofLens(page);
    const file = { ...(await demoProjectFile(page)), name: OPENED_NAME };
    let failed = 0;
    await page.route("**/api/project/open", (route) => {
      failed += 1;
      return route.abort("connectionrefused");
    });
    await dialogOpened(page);

    await fileInput(page).setInputFiles(asFile("Block-B.rtd", JSON.stringify(file)));

    await refused(page, UNREACHABLE);
    await expect(tryAgain(page)).toBeVisible();
    expect(failed).toBe(1);
    await page.unroute("**/api/project/open");

    await tryAgain(page).click();

    await read(page, "Block-B.rtd", OPENED_NAME);
    await expect(tryAgain(page)).toHaveCount(0);
    await openButton(page).click();
    await expect(dialog(page)).toBeHidden({ timeout: RUN });
    await expect(switcher(page)).toContainText(OPENED_NAME, { timeout: RUN });
  });
});

test.describe("axe", () => {
  test("finds nothing serious or critical with the dialog open over a format 1 file read with its notes", async ({ page }) => {
    await theRoofLens(page);
    const file = asFormat1(await demoProjectFile(page));
    await dialogOpened(page);
    await fileInput(page).setInputFiles(asFile("Test-project.rtd", JSON.stringify(file)));
    await expect(notes(page)).toHaveCount(2);

    expect(await graveFindings(page)).toEqual([]);
  });
});
