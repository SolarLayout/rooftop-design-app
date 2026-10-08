import AxeBuilder from "@axe-core/playwright";
import type { Download, Locator, Page, Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { expect, test } from "../fixtures";

// The files of Handover, pull request 4 of Phase 9 (plan/phase-09-plan.md, steps 18 to 21, decisions 8, 10 and 15; the boards
// "Handover, previews" and "Handover, states"): the CAD layout's layers and the Google Earth model's names equal the run's
// answer and the document; the hourly data's rows equal the file's, which is asked once for the preview and the download; the
// DXF, the KMZ, the CSV and the zip are captured on desktop and checked as bytes; Download all shows its ring on its way and
// cannot be pressed before a voltage. Every number and word is read from the API's answers and the downloaded files.

const RUN = 90_000;

type Option = { key: string; n_series: number; n_strings: number; n_inverters: number; n_modules: number; system: { inverters: { label: string }[] } };
type Answer = { options: Option[]; chosen_option: string | null; readouts: { positions: number }; weather: { hours: number } };
type Obstacle = { name: string; kind: string; height: number };
type Document = { name: string; roof: { obstacles: Obstacle[] } };
type PagesAnswer = { pages: { number: number; title: string; png: string }[] };

const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
const count = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 0 });
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
/** The demo's name in the file's name, as the API writes it: the words joined by dashes. */
const stemOf = (name: string) => name.trim().split(/\s+/).join("-");
/** A height as the engine writes it into the KML and the DXF (Python's :g): whole metres without a decimal. */
const heightOf = (height: number) => String(Number(height.toPrecision(6)));
const isRequestFor = (kind: string) => (request: Request) => new RegExp(`/api/export/${kind}(\\?|$)`).test(request.url());

const preview = (page: Page) => page.getByTestId("preview");
const previewAction = (page: Page) => page.getByTestId("preview-action").getByRole("button").filter({ visible: true });
const downloadAll = (page: Page) => page.getByRole("button", { name: "Download all" });
const names = (rows: Locator) => rows.locator("dt").allTextContents();
const words = (rows: Locator) => rows.locator("dd").allTextContents();

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

/** An item open with the run's answer and the document, as the API handed them out; the list itself for no item. */
async function theItem(page: Page, item: string): Promise<{ answer: Answer; document: Document; option: Option }> {
  const demo = page.waitForResponse((response) => response.url().endsWith("/api/demo"), { timeout: RUN });
  const ran = page.waitForRequest((request) => request.url().endsWith("/api/design"), { timeout: RUN });
  await page.goto(item === "" ? "/handover" : `/handover/${item}`);
  const document = (await (await demo).json()) as Document;
  const answer = await resultOf(await ran);
  return { answer, document, option: chosenOf(answer) };
}

/** The demo at 600 V, the user's: no string length fits its inverter, so there is no option to make files of. */
async function whereNoLengthFits(page: Page): Promise<void> {
  await page.route("**/api/demo", async (route) => {
    const answer = await route.fetch();
    const demo: Record<string, unknown> = await answer.json();
    await route.fulfill({ response: answer, json: { ...demo, system_voltage: 600, system_voltage_by: "user" } });
  });
}

/** A download captured: its name and its bytes. */
async function captured(download: Promise<Download>): Promise<{ name: string; bytes: Buffer }> {
  const file = await download;
  return { name: file.suggestedFilename(), bytes: readFileSync((await file.path())!) };
}

const LOCAL_FILE_HEADER = Buffer.from("PK\x03\x04", "latin1");
const DEFLATED = 8;

/** The entries of a zip, read from its local file headers: each name with its content, inflated when it was deflated. */
function entriesOf(zip: Buffer): { name: string; content: Buffer }[] {
  const entries: { name: string; content: Buffer }[] = [];
  let at = zip.indexOf(LOCAL_FILE_HEADER);
  while (at !== -1) {
    const method = zip.readUInt16LE(at + 8);
    const compressedSize = zip.readUInt32LE(at + 18);
    const nameLength = zip.readUInt16LE(at + 26);
    const extraLength = zip.readUInt16LE(at + 28);
    const name = zip.subarray(at + 30, at + 30 + nameLength).toString("utf8");
    const start = at + 30 + nameLength + extraLength;
    const data = zip.subarray(start, start + compressedSize);
    entries.push({ name, content: method === DEFLATED ? inflateRawSync(data) : Buffer.from(data) });
    at = zip.indexOf(LOCAL_FILE_HEADER, start + compressedSize);
  }
  return entries;
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("the CAD layout (step 19, decision 8)", () => {
  const layers = (page: Page) => page.getByTestId("layer");
  const lastString = (option: Option) => `STRING_S${String(option.n_strings).padStart(2, "0")}`;

  test("the layers equal the run's and the document's, in the engine's order with the board's words; the engine's plan is the page of the report titled Layout", async ({ page }) => {
    const pages = page.waitForResponse((response) => isRequestFor("report-pages")(response.request()) && response.ok(), { timeout: RUN });
    const { answer, document, option } = await theItem(page, "cad-layout");
    const unused = answer.readouts.positions - option.n_modules;

    await expect(layers(page)).toHaveCount(8, { timeout: RUN });
    expect(await names(layers(page))).toEqual(["ROOF", "SETBACK", "OBSTACLES", "KEEPOUT", "MODULES_UNUSED", "INVERTERS", "TEXT", `STRING_S01 to ${lastString(option)}`]);
    expect(await words(layers(page))).toEqual([
      "the outline",
      "the inner line",
      `${document.roof.obstacles.length} footprints`,
      "the kept-clear areas",
      `${count(unused)} positions`,
      String(option.n_inverters),
      `the names and heights, ${option.system.inverters.map((inverter) => inverter.label).join(", ")}`,
      `${option.n_series} modules each`,
    ]);
    await expect(preview(page)).toContainText("R2010 · metres · x east, y north");
    const plan = ((await (await pages).json()) as PagesAnswer).pages.find((one) => one.title === "Layout")!;
    await expect(page.getByTestId("plan-image")).toHaveAttribute("src", `data:image/png;base64,${plan.png}`, { timeout: RUN });
    await expect(page.getByTestId("plan-image")).toHaveAttribute("alt", `Layout · page ${plan.number} of the report`);
    await expect(previewAction(page)).toHaveAccessibleName("Download DXF");
  });

  test("desktop: Download DXF saves the API's drawing, named after the design, R2010 with a layer per string and none beyond", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    const { document, option } = await theItem(page, "cad-layout");
    await expect(layers(page)).toHaveCount(8, { timeout: RUN });

    const download = captured(page.waitForEvent("download"));
    await previewAction(page).click();
    const { name, bytes } = await download;

    expect(name).toBe(`${stemOf(document.name)}-layout.dxf`);
    expect(name).toMatch(/-layout\.dxf$/);
    const text = bytes.toString("utf8");
    expect(text).toContain("AC1024");
    expect(text).toContain(lastString(option));
    expect(text).not.toContain(`STRING_S${String(option.n_strings + 1).padStart(2, "0")}`);
    for (const obstacle of document.roof.obstacles) expect(text).toContain(`${obstacle.name} h=${heightOf(obstacle.height)}`);
  });

  test("axe finds nothing serious or critical on the CAD layout", async ({ page }) => {
    await theItem(page, "cad-layout");
    await expect(layers(page)).toHaveCount(8, { timeout: RUN });
    await expect(page.getByTestId("plan-image")).toBeVisible({ timeout: RUN });

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the Google Earth model (step 19, decision 8)", () => {
  const inside = (page: Page) => page.getByTestId("kml-inside");
  const notInside = (page: Page) => page.getByTestId("kml-not-inside");
  const placemarks = (document: Document, option: Option) => ["Roof", ...document.roof.obstacles.map((obstacle) => `${obstacle.name} h=${heightOf(obstacle.height)}`), `Modules (${count(option.n_modules)})`];

  test("what is in the file is named as the engine's KML names it, from the document and the run; what is not is said", async ({ page }) => {
    const { answer, document, option } = await theItem(page, "earth-model");

    await expect(inside(page)).toHaveCount(document.roof.obstacles.length + 2, { timeout: RUN });
    expect(await names(inside(page))).toEqual(placemarks(document, option));
    expect((await words(inside(page)))[1]).toMatch(/^the (box|tank|wall|tree|building)'s footprint, its height in the name$/);
    expect(await names(notInside(page))).toEqual([`Positions not used (${count(answer.readouts.positions - option.n_modules)})`, "The inverter and the wiring", "Heights as shapes"]);
    await expect(previewAction(page)).toHaveAccessibleName("Download KMZ");
  });

  test("desktop: Download KMZ saves the API's model, a zip holding doc.kml with the names the preview shows", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    const { document, option } = await theItem(page, "earth-model");
    await expect(inside(page)).toHaveCount(document.roof.obstacles.length + 2, { timeout: RUN });

    const download = captured(page.waitForEvent("download"));
    await previewAction(page).click();
    const { name, bytes } = await download;

    expect(name).toBe(`${stemOf(document.name)}.kmz`);
    expect(bytes.subarray(0, 4)).toEqual(LOCAL_FILE_HEADER);
    const entries = entriesOf(bytes);
    expect(entries.map((entry) => entry.name)).toEqual(["doc.kml"]);
    const kml = entries[0]!.content.toString("utf8");
    expect(kml).toContain(`<name>${document.name}</name>`);
    for (const placemark of placemarks(document, option)) expect(kml).toContain(`<name>${placemark}</name>`);
    expect(document.roof.obstacles.length).toBeGreaterThan(0);
  });

  test("axe finds nothing serious or critical on the Google Earth model", async ({ page }) => {
    const { document } = await theItem(page, "earth-model");
    await expect(inside(page)).toHaveCount(document.roof.obstacles.length + 2, { timeout: RUN });

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the hourly data (step 20, decision 8)", () => {
  const rows = (page: Page) => page.getByTestId("csv-row");
  const columns = (page: Page) => page.getByTestId("csv-column");
  const SHOWN = 8;

  /** Hears every request for the CSV from now on. */
  function csvAsked(page: Page): Request[] {
    const requests: Request[] = [];
    page.on("request", (request) => {
      if (isRequestFor("csv")(request)) requests.push(request);
    });
    return requests;
  }

  /** The item open with the file the API answered for the preview, as text. */
  async function theHourlyData(page: Page): Promise<{ answer: Answer; document: Document; text: string; requests: Request[] }> {
    const requests = csvAsked(page);
    const { answer, document } = await theItem(page, "hourly-data");
    // The file as the API writes it, asked once more by the test itself (the browser's own answer cannot be read once
    // the page has taken its body); the preview is of the option shown.
    const asked = await page.request.post("/api/export/csv", { data: { ...document, chosen_option: answer.chosen_option } });
    expect(asked.ok()).toBe(true);
    const text = await asked.text();
    await expect(rows(page)).toHaveCount(SHOWN, { timeout: RUN });
    return { answer, document, text, requests };
  }

  test("the header and the first rows equal the file's, cell for cell; the caption counts the file's rows, which are the weather's hours; the columns are named as the file names them", async ({ page }) => {
    const { answer, text, requests } = await theHourlyData(page);
    const lines = text.split("\n").filter((line) => line !== "");
    const header = lines[0]!.split(",");

    expect(lines).toHaveLength(answer.weather.hours + 1);
    expect(header).toHaveLength(6);
    expect(header[0]).toBe("time_utc_hour_start");
    await expect(page.getByTestId("csv-table").locator("th")).toHaveText(header);
    for (const [index, line] of lines.slice(1, SHOWN + 1).entries()) await expect(rows(page).nth(index).locator("td")).toHaveText(line.split(","));
    await expect(page.getByTestId("csv-caption")).toHaveText(`The first ${SHOWN} of ${count(lines.length - 1)} rows`);
    expect(await names(columns(page))).toEqual(header);
    await expect(page.getByTestId("preview-facts")).toHaveText(`${count(answer.weather.hours)} rows · irradiance, temperature, power`);
    expect(requests).toHaveLength(1);
  });

  test("desktop: Download CSV saves the very file of the preview without a second request: 8,761 lines, the header's five columns after the time", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    const { answer, document, text, requests } = await theHourlyData(page);

    const download = captured(page.waitForEvent("download"));
    await previewAction(page).click();
    const { name, bytes } = await download;

    expect(name).toBe(`${stemOf(document.name)}-hourly.csv`);
    expect(bytes.toString("utf8")).toBe(text);
    const lines = bytes.toString("utf8").split("\n").filter((line) => line !== "");
    expect(lines).toHaveLength(answer.weather.hours + 1);
    expect(lines).toHaveLength(8761);
    const [time, ...values] = lines[0]!.split(",");
    expect(time).toBe("time_utc_hour_start");
    expect(values).toHaveLength(5);
    for (const line of lines.slice(1)) expect(line.split(",")).toHaveLength(6);
    expect(requests).toHaveLength(1);
  });

  test("the CSV refused is said in the API's words with Try again, which asks again", async ({ page }) => {
    const REFUSED = { error: { code: "export_failed", message: "The hours could not be written. Try again.", field: null } };
    await page.route("**/api/export/csv**", (route) => route.fulfill({ status: 503, json: REFUSED }));
    const requests = csvAsked(page);
    await theItem(page, "hourly-data");
    const failed = preview(page).getByTestId("run-failed");

    await expect(failed).toContainText("The hourly data was not made", { timeout: RUN });
    await expect(failed).toContainText(REFUSED.error.message);
    await expect(page.getByTestId("toast")).toHaveCount(0);
    expect(requests).toHaveLength(1);

    await page.unroute("**/api/export/csv**");
    await failed.getByRole("button", { name: "Try again" }).click();
    await expect(rows(page)).toHaveCount(SHOWN, { timeout: RUN });
    await expect(failed).toHaveCount(0);
    expect(requests).toHaveLength(2);
  });

  test("axe finds nothing serious or critical on the hourly data", async ({ page }) => {
    await theHourlyData(page);

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("Download all (step 21, decision 10)", () => {
  const ENDINGS = ["-report.pdf", "-layout.dxf", ".kmz", "-hourly.csv", "-single-line-diagram.png", ".rtd"];
  /** The list, where the button stands: the list's own address, on phone the list alone. */
  const theList = (page: Page) => theItem(page, "").then(async (opened) => {
    await expect(downloadAll(page)).not.toHaveAttribute("aria-disabled", "true", { timeout: RUN });
    return opened;
  });

  test("desktop: the zip captured holds the six files, each named as its own download", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    const { document } = await theList(page);

    const asked = page.waitForRequest(isRequestFor("zip"));
    const download = captured(page.waitForEvent("download"));
    await downloadAll(page).click();
    const [request, { name, bytes }] = await Promise.all([asked, download]);

    expect(new URL(request.url()).searchParams.get("day")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(name).toBe(`${stemOf(document.name)}.zip`);
    expect(bytes.subarray(0, 4)).toEqual(LOCAL_FILE_HEADER);
    const text = bytes.toString("latin1");
    expect(text.match(/PK\x03\x04/g)).toHaveLength(6);
    const entries = entriesOf(bytes);
    expect(entries.map((entry) => entry.name)).toEqual(ENDINGS.map((ending) => `${stemOf(document.name)}${ending}`));
    expect(entries[0]!.content.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(JSON.parse(entries[5]!.content.toString("utf8"))).toMatchObject({ name: document.name, format: 2 });
    await expect(downloadAll(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("on its way the button shows its ring and cannot be pressed again; its facts count the files", async ({ page }) => {
    await page.route("**/api/export/zip**", () => {
      // Held: the zip stays on its way.
    });
    await theList(page);
    await expect(page.getByTestId("download-all")).toContainText("6 files · one zip");

    await downloadAll(page).click();

    await expect(downloadAll(page)).toHaveAttribute("aria-disabled", "true");
    await expect(downloadAll(page).locator("svg.turning")).toBeVisible();
    await expect(downloadAll(page)).toHaveCSS("opacity", "0.45");
  });

  test("where no string length fits it cannot be pressed, as the files of the design cannot be made", async ({ page }, testInfo) => {
    await whereNoLengthFits(page);
    await theItem(page, isPhone(testInfo.project.name) ? "" : "report");

    await expect(page.getByTestId("deliverables").getByTestId("deliverable-facts").first()).toContainText("No string length fits", { timeout: RUN });
    await expect(downloadAll(page)).toHaveAttribute("aria-disabled", "true");
  });
});
