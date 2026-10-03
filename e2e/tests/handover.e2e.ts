import AxeBuilder from "@axe-core/playwright";
import type { Download, Page, Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, test } from "../fixtures";

// The Handover workspace, pull request 1 of Phase 9 (plan/phase-09-plan.md, steps 2 to 8; the boards "Handover" on three
// sizes, "Handover, previews" and "Handover, states"): the list's facts equal the run's answer; a row opens its item, on
// phone as a pushed screen; before a voltage the API's words and the project file alone live; Save a copy downloads the .rtd
// the API writes, named after the design; a download that failed is a toast with Try again; the name is an edit, here and
// in the switcher, undone by key. Every number and every word is read from the run's answer and the downloaded files.

const RUN = 90_000;

type BomLine = { item: string; qty: number; unit: string };
type Option = { key: string; letter: string; n_series: number; n_strings: number; n_inverters: number; n_modules: number; bom: BomLine[]; cable_schedule: { voc_cold_v: number }[] };
type Answer = {
  options: Option[];
  chosen_option: string | null;
  no_options: { title: string; message: string } | null;
  equipment: { module: { pnom_w: number }; inverter: { n_mppt: number } };
  weather: { label: string; hours: number };
};
type Document = { name: string; format: number; system_voltage: number | null };

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
/** A number as the page shows it: a comma between thousands. */
const count = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
const undoKey = (projectName: string) => (projectName === "desktop" ? "Meta+z" : "Control+z");

/** The demo's name in the file's name, as the API writes it: the words joined by dashes. */
const stemOf = (name: string) => name.trim().split(/\s+/).join("-");

const DEMO_NAME = "Pune demo roof";

/** The facts of the seven rows of the run, in the board's words, from the run's answer (decision 14). */
function factsOf(answer: Answer): string[] {
  const option = chosenOf(answer);
  const line = (item: string) => option.bom.find((one) => one.item === item)!;
  const inverters = option.n_inverters === 1 ? "1 inverter" : `${option.n_inverters} inverters`;
  return [
    "A4 landscape",
    `${option.n_strings} strings of ${option.n_series} × ${count(answer.equipment.module.pnom_w)} Wp · ${inverters}, ${answer.equipment.inverter.n_mppt} MPPT`,
    `${count(line("PV module").qty)} modules · ${count(line("Mounting structure").qty)} ${line("Mounting structure").unit} · ${count(line("DC cable").qty)} ${line("DC cable").unit} DC cable`,
    `${option.n_strings} strings · Voc cold ${count(Math.max(...option.cable_schedule.map((row) => row.voc_cold_v)))} V`,
    "Metres · one layer per string",
    `Roof, obstacles with heights, ${count(option.n_modules)} modules`,
    `${count(answer.weather.hours)} rows · irradiance, temperature, power`,
  ];
}

const bar = (page: Page) => page.getByRole("banner");
const switcher = (page: Page) => bar(page).getByRole("button", { name: /^(Pune demo roof|Block B|Pune demo roof, block B)/ });
const rows = (page: Page) => page.getByTestId("deliverables").getByTestId("deliverable");
const rowFacts = (page: Page) => page.getByTestId("deliverables").getByTestId("deliverable-facts");
const card = (page: Page) => page.getByTestId("project-file-card");
const preview = (page: Page) => page.getByTestId("preview");
const previewAction = (page: Page) => page.getByTestId("preview-action").getByRole("button").filter({ visible: true });
const projectFile = (page: Page) => page.getByTestId("project-file");
const nameField = (page: Page) => projectFile(page).getByRole("textbox", { name: "Name" });
const toast = (page: Page) => page.getByTestId("toast");
const menu = (page: Page) => page.getByTestId("project-menu");

/** The list with the run's answer landed: the facts of the single-line diagram are its. */
async function theHandoverPage(page: Page, path = "/handover"): Promise<Answer> {
  const first = ran(page);
  await page.goto(path);
  const answer = await resultOf(await first);
  const expected = factsOf(answer);
  await expect(rowFacts(page).nth(1)).toHaveText(expected[1]!, { timeout: RUN });
  return answer;
}

/** The demo as the API hands it out, with its system voltage left out: the engine's reason, in its words. */
async function withoutAVoltage(page: Page, path = "/handover"): Promise<Answer> {
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo: Record<string, unknown> = await answer.json();
    await route.fulfill({ response: answer, json: { ...demo, system_voltage: null } });
  });
  const first = ran(page);
  await page.goto(path);
  const answer = await resultOf(await first);
  expect(answer.options).toEqual([]);
  return answer;
}

/** A download captured, with its name and what it holds. */
async function captured(download: Promise<Download>): Promise<{ name: string; document: Document }> {
  const file = await download;
  const text = readFileSync((await file.path())!, "utf8");
  return { name: file.suggestedFilename(), document: JSON.parse(text) as Document };
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

/** The keys of undo are the page's, not a field's: the focus leaves the control first. */
async function undo(page: Page, projectName: string): Promise<void> {
  await page.getByRole("heading", { level: 2 }).first().click({ force: true });
  await page.keyboard.press(undoKey(projectName));
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the list (decisions 3 and 14)", () => {
  test("the facts of the rows and of the project file equal the run's answer; on desktop and tablet the first item stands beside the list", async ({ page }, testInfo) => {
    const answer = await theHandoverPage(page);

    await expect(rows(page)).toHaveCount(7);
    await expect(rowFacts(page)).toHaveText(factsOf(answer));
    await expect(card(page)).toContainText(`${stemOf(DEMO_NAME)}.rtd · opens offline`);
    await expect(card(page).getByRole("button", { name: "Save a copy" })).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("button", { name: "Download all" })).toHaveAttribute("aria-disabled", "true");
    if (isPhone(testInfo.project.name)) {
      await expect(preview(page)).toBeHidden();
      return;
    }
    await expect(preview(page).getByRole("heading", { level: 2, name: "Design report" })).toBeVisible();
    // The report's pages count themselves into its facts once they come (handover-report.e2e.ts): the paper size stands either way.
    await expect(page.getByTestId("preview-facts")).toContainText(factsOf(answer)[0]!);
    await expect(previewAction(page)).toHaveAccessibleName("Download PDF");
  });

  test("a row pressed opens its item at its address, and the row says so; on phone the item is pushed over the list, and the back row leads to it", async ({ page }, testInfo) => {
    await theHandoverPage(page);

    await rows(page).filter({ hasText: "Bill of materials" }).click();

    await expect(page).toHaveURL(/\/handover\/bill-of-materials$/);
    await expect(preview(page).getByRole("heading", { level: 2, name: "Bill of materials" })).toBeVisible();
    if (isPhone(testInfo.project.name)) {
      await expect(page.getByRole("navigation", { name: "Deliverables" })).toBeHidden();
      await page.getByRole("link", { name: "Back to Handover" }).click();
      await expect(page).toHaveURL(/\/handover$/);
      await expect(rows(page).first()).toBeVisible();
      return;
    }
    await expect(rows(page).filter({ hasText: "Bill of materials" })).toHaveAttribute("aria-current", "page");
    await expect(rows(page).filter({ hasText: "Design report" })).not.toHaveAttribute("aria-current", "page");
  });

  test("axe finds nothing serious or critical on the list", async ({ page }) => {
    await theHandoverPage(page);

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("before a voltage (decision 11)", () => {
  test("every row but the project file says the API's title and is dim; the preview says the API's words and leads to the Strings lens", async ({ page }, testInfo) => {
    const answer = await withoutAVoltage(page, isPhone(testInfo.project.name) ? "/handover/report" : "/handover");
    const title = answer.no_options!.title;

    if (!isPhone(testInfo.project.name)) {
      await expect(rowFacts(page)).toHaveText(Array<string>(7).fill(title), { timeout: RUN });
      // The icon of a waiting row is dim; its words and its badge stay readable, since the row is a link that works.
      for (const row of await rows(page).all()) {
        await expect(row.locator("> span").last()).toHaveCSS("opacity", "0.45");
        await expect(row).toHaveCSS("opacity", "1");
      }
      await expect(card(page)).toContainText(`${stemOf(DEMO_NAME)}.rtd · opens offline`);
      await expect(card(page)).toHaveCSS("opacity", "1");
      await expect(card(page).getByRole("button", { name: "Save a copy" })).not.toHaveAttribute("aria-disabled", "true");
    }
    const waits = page.getByTestId("files-wait");
    await expect(waits).toContainText(title, { timeout: RUN });
    await expect(waits).toContainText(answer.no_options!.message);
    await expect(waits.getByRole("link", { name: "Open the Strings lens" })).toHaveAttribute("href", "/studio/strings");
    await expect(page.getByTestId("preview-facts")).toHaveText("A4 landscape");
    await expect(previewAction(page)).toHaveAttribute("aria-disabled", "true");
  });

  test("the project file alone is live: its item has no decision card, and its press can be taken", async ({ page }) => {
    await withoutAVoltage(page, "/handover/project-file");

    await expect(projectFile(page)).toBeVisible({ timeout: RUN });
    await expect(page.getByTestId("files-wait")).toHaveCount(0);
    await expect(previewAction(page)).not.toHaveAttribute("aria-disabled", "true");
    await expect(projectFile(page).getByTestId("in-the-file").filter({ hasText: "System voltage" })).toContainText("Choose a system voltage to size the strings");
  });

  test("axe finds nothing serious or critical", async ({ page }, testInfo) => {
    const answer = await withoutAVoltage(page, isPhone(testInfo.project.name) ? "/handover/report" : "/handover");
    await expect(page.getByTestId("files-wait")).toContainText(answer.no_options!.title, { timeout: RUN });

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the project file (decisions 9 and 12)", () => {
  test("the item: the name as a field, the file's name and size, the format, what is in it from the document and the run", async ({ page }) => {
    const answer = await theHandoverPage(page, "/handover/project-file");
    const option = chosenOf(answer);
    const inTheFile = (label: string) => projectFile(page).getByTestId("in-the-file").filter({ hasText: label });

    await expect(nameField(page)).toHaveValue(DEMO_NAME);
    await expect(projectFile(page).getByTestId("file-name")).toHaveText(`${stemOf(DEMO_NAME)}.rtd`);
    await expect(projectFile(page).getByTestId("file-size")).toHaveText(/^\d[\d,]* KB$/, { timeout: RUN });
    await expect(projectFile(page)).toContainText("Format 2 · opens offline, in the desktop app too");
    await expect(inTheFile("Weather")).toContainText(`${answer.weather.label} · ${count(answer.weather.hours)} hours`);
    await expect(inTheFile("System voltage")).toContainText("1500 V");
    await expect(inTheFile("Chosen option")).toContainText(`${option.letter} · ${option.n_series} × ${option.n_strings} on ${option.n_inverters === 1 ? "1 inverter" : `${option.n_inverters} inverters`}`);
    await expect(inTheFile("Module file")).toContainText(".PAN");
    await expect(inTheFile("Inverter file")).toContainText(".OND");
  });

  test("desktop: Save a copy downloads the .rtd the API writes, named after the design, JSON of format 2 with the document's name; from the card, the preview and the switcher", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    await theHandoverPage(page, "/handover/project-file");
    await expect(projectFile(page).getByTestId("file-size")).toBeVisible({ timeout: RUN });
    const expected = `${stemOf(DEMO_NAME)}.rtd`;

    const fromTheCard = captured(page.waitForEvent("download"));
    await card(page).getByRole("button", { name: "Save a copy" }).click();
    expect(await fromTheCard).toMatchObject({ name: expected, document: { name: DEMO_NAME, format: 2 } });

    const fromThePreview = captured(page.waitForEvent("download"));
    await previewAction(page).click();
    expect((await fromThePreview).name).toBe(expected);

    const fromTheSwitcher = captured(page.waitForEvent("download"));
    await switcher(page).click();
    await menu(page).getByRole("menuitem", { name: "Save a copy" }).click();
    expect((await fromTheSwitcher).name).toBe(expected);
    await expect(toast(page)).toHaveCount(0);
  });

  test("desktop: a download that failed is a toast with the API's words and Try again, which downloads", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    const REFUSED = { error: { code: "export_failed", message: "The project file could not be written. Try again.", field: null } };
    await page.route("**/api/export/rtd**", (route) => route.fulfill({ status: 503, json: REFUSED }));
    await theHandoverPage(page);

    await card(page).getByRole("button", { name: "Save a copy" }).click();

    await expect(toast(page)).toContainText(REFUSED.error.message);
    await expect(toast(page).getByRole("img", { name: "Note" })).toBeVisible();
    await page.unroute("**/api/export/rtd**");
    const download = captured(page.waitForEvent("download"));
    await toast(page).getByRole("button", { name: "Try again" }).click();
    expect((await download).name).toBe(`${stemOf(DEMO_NAME)}.rtd`);
    await expect(toast(page)).toHaveCount(0);
  });

  test("desktop: the server unreachable is said in the client's words", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    await page.route("**/api/export/rtd**", (route) => route.abort("connectionrefused"));
    await theHandoverPage(page);

    await card(page).getByRole("button", { name: "Save a copy" }).click();

    await expect(toast(page)).toContainText("The server cannot be reached. Check the connection and try again.");
    await toast(page).getByRole("button", { name: "Close" }).click();
    await expect(toast(page)).toHaveCount(0);
  });

  test("axe finds nothing serious or critical on the project file", async ({ page }) => {
    await theHandoverPage(page, "/handover/project-file");
    await expect(projectFile(page).getByTestId("file-size")).toBeVisible({ timeout: RUN });

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the name (decision 13)", () => {
  const NEW_NAME = "Pune demo roof, block B";

  test("typed in the project file: the file's name follows live, the commit shows in the top bar and the switcher and names the file; an empty name is refused; undo by key gives the old name back", async ({ page }, testInfo) => {
    await theHandoverPage(page, "/handover/project-file");
    const asked: string[] = [];
    page.on("request", (request) => {
      if (/\/api\/(design|layout)$/.test(request.url())) asked.push(request.url());
    });

    await nameField(page).fill(NEW_NAME);
    await expect(projectFile(page).getByTestId("file-name")).toHaveText("Pune-demo-roof,-block-B.rtd");
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await nameField(page).press("Enter");

    await expect(switcher(page)).toContainText(NEW_NAME);
    await expect(nameField(page)).toHaveValue(NEW_NAME);
    if (!isPhone(testInfo.project.name)) await expect(card(page)).toContainText("Pune-demo-roof,-block-B.rtd · opens offline");
    await switcher(page).click();
    await expect(menu(page).getByTestId("this-design")).toContainText(NEW_NAME);
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeHidden();
    if (isDesktop(testInfo.project.name)) {
      const download = captured(page.waitForEvent("download"));
      await previewAction(page).click();
      expect(await download).toMatchObject({ name: "Pune-demo-roof,-block-B.rtd", document: { name: NEW_NAME } });
    }

    await nameField(page).fill("   ");
    await nameField(page).press("Enter");
    await expect(projectFile(page).getByRole("status")).toHaveText("A name is needed");
    await expect(nameField(page)).toHaveValue(NEW_NAME);
    await expect(switcher(page)).toContainText(NEW_NAME);

    await undo(page, testInfo.project.name);
    await expect(nameField(page)).toHaveValue(DEMO_NAME);
    await expect(switcher(page)).toContainText(DEMO_NAME);
    await expect(projectFile(page).getByTestId("file-name")).toHaveText(`${stemOf(DEMO_NAME)}.rtd`);
    // The name asks neither the layout nor the run.
    expect(asked).toEqual([]);
  });

  test("renamed from the switcher: Rename turns the row into the field, Enter commits, Escape gives the name back", async ({ page }) => {
    await theHandoverPage(page);
    await switcher(page).click();
    await menu(page).getByRole("button", { name: "Rename" }).click();
    const field = menu(page).getByRole("textbox", { name: "Name" });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue(DEMO_NAME);

    await field.fill("Block B");
    await field.press("Enter");

    await expect(menu(page).getByTestId("this-design")).toContainText("Block B");
    await expect(menu(page).getByRole("textbox", { name: "Name" })).toHaveCount(0);
    await expect(switcher(page)).toContainText("Block B");

    await menu(page).getByRole("button", { name: "Rename" }).click();
    await menu(page).getByRole("textbox", { name: "Name" }).fill("Something else");
    await page.keyboard.press("Escape");
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByTestId("this-design")).toContainText("Block B");
    await expect(switcher(page)).toContainText("Block B");
  });
});
