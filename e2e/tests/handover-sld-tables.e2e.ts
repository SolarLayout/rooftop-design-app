import AxeBuilder from "@axe-core/playwright";
import type { Locator, Page, Request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { expect, test } from "../fixtures";

// The single-line diagram, the bill of materials and the DC cable schedule, pull request 3 of Phase 9 (plan/phase-09-plan.md,
// steps 13 to 17, decisions 6, 7, 15 and 16; the boards "Handover, previews" and "Handover, states"): every word of the SVG
// equals what the engine's drawing says of the run's answer; the tooltip of a block under the pointer, under a finger and
// with the focus; the PNG captured on desktop; the tables' rows equal the run's; the schedule sorts and gives the engine's
// order back; Copy as table writes what is shown to the clipboard and says so in a toast, which leaves after its time.
// Every number and every word is read from the run's answer.

const RUN = 90_000;
/** Milliseconds a toast of something done stays (docs/design/design-tokens.md, "Numbers in code", TOAST_STAYS). */
const TOAST_STAYS = 5_000;

type PVString = { label: string; inverter: number; mppt: number };
type Load = { inverter: number; mppt: number; imp_a: number; imp_limit_a: number | null };
type BomLine = { item: string; spec: string; qty: number; unit: string };
type CableRow = { string: string; inverter: string; mppt: number; modules: number; voc_cold_v: number; isc_a: number; length_m: number; size: string };
type Option = {
  key: string;
  letter: string;
  n_series: number;
  n_strings: number;
  n_inverters: number;
  system: { strings: PVString[] };
  mppt_loads: Load[];
  bom: BomLine[];
  cable_schedule: CableRow[];
};
type Answer = { options: Option[]; chosen_option: string | null; equipment: { module: { pnom_w: number }; inverter: { pnom_kw: number; n_mppt: number } } };

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
/** A number as the engine prints it with Python's :g: without trailing zeros. */
const general = (value: number) => String(Number(value.toPrecision(6)));
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const isPhone = (projectName: string) => projectName === "phone";
const isDesktop = (projectName: string) => projectName === "desktop";
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const preview = (page: Page) => page.getByTestId("preview");
const previewAction = (page: Page) => page.getByTestId("preview-action").getByRole("button").filter({ visible: true });
const toast = (page: Page) => page.getByTestId("toast");
const sld = (page: Page) => page.getByTestId("sld");
const drawing = (page: Page) => page.getByTestId("sld-drawing");
const blocks = (page: Page) => drawing(page).getByTestId("mppt-block");
const block = (page: Page, mppt: number) => drawing(page).locator(`[data-testid="mppt-block"][data-mppt="${mppt}"]`);
/** The tooltip of a value that is shown: a popover that is closed is not seen. */
const tooltip = (page: Page) => page.getByTestId("value-tooltip").filter({ visible: true });
const copyAsTable = (page: Page) => preview(page).getByRole("button", { name: "Copy as table" }).filter({ visible: true });
/** The rows of a table: on phone each is a card. */
const rows = (body: Locator, projectName: string) => (isPhone(projectName) ? body.getByRole("listitem") : body.getByRole("row").filter({ has: body.page().getByRole("rowheader") }));
/** The words of a table row or a card, the name first. */
async function wordsOf(row: Locator, projectName: string): Promise<string[]> {
  if (isPhone(projectName)) return [await row.getByRole("heading").innerText(), ...(await row.locator("dd").allInnerTexts())];
  return [await row.getByRole("rowheader").innerText(), ...(await row.getByRole("cell").allInnerTexts())];
}

/** The item open with the run's answer landed: its body is there. */
async function theItem(page: Page, item: string, body: (page: Page) => Locator): Promise<Option & { answer: Answer }> {
  const first = ran(page);
  await page.goto(`/handover/${item}`);
  const answer = await resultOf(await first);
  await expect(body(page)).toBeVisible({ timeout: RUN });
  return { ...chosenOf(answer), answer };
}

async function grave(page: Page): Promise<string[]> {
  const found = await new AxeBuilder({ page }).analyze();
  return found.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);
}

// What the engine's drawing says of an option (plots.py, draw_sld; lib/handover/sld.ts).
const stringsOf = (option: Option, inverter: number, mppt: number) => option.system.strings.filter((string) => string.inverter === inverter && string.mppt === mppt).map((string) => string.label);
const loadOf = (option: Option, inverter: number, mppt: number) => option.mppt_loads.find((load) => load.inverter === inverter && load.mppt === mppt)!;
const loadWordsOf = (load: Load) => (load.imp_limit_a === null ? `Imp ${fixed(load.imp_a, 1)} A · limit not known` : `Imp ${fixed(load.imp_a, 1)} of ${fixed(load.imp_limit_a, 1)} A`);

/** The bill of materials as the page copies it: tab-separated lines with a header line. */
const bomTextOf = (option: Option) =>
  ["Item\tSpecification\tQty\tUnit", ...option.bom.map((line) => [line.item, line.spec, fixed(line.qty, 0), line.unit].join("\t"))].join("\n");
const scheduleLineOf = (row: CableRow) => [row.string, row.inverter, String(row.mppt), String(row.modules), fixed(row.voc_cold_v, 0), fixed(row.isc_a, 2), fixed(row.length_m, 1), row.size];
const totalOf = (option: Option) => [plural(option.cable_schedule.length, "string", "strings"), "", "", "", "", "", fixed(option.cable_schedule.reduce((sum, row) => sum + row.length_m, 0), 1), ""];

test.describe.configure({ timeout: RUN * 2 });

test.describe("the single-line diagram (decision 6)", () => {
  test("the title, the inverter's words, every block's and every line's words equal the run's answer; the AC side word for word", async ({ page }, testInfo) => {
    const option = await theItem(page, "single-line-diagram", drawing);
    const { module, inverter } = option.answer.equipment;

    await expect(sld(page).getByRole("heading", { level: 3 })).toHaveText(`Single-line diagram · ${option.n_strings} strings of ${option.n_series} × ${general(module.pnom_w)} Wp`);
    await expect(drawing(page)).toHaveAttribute("data-shape", isDesktop(testInfo.project.name) ? "across" : "down");
    // textContent, not innerText: the words are SVG text elements.
    const words = await drawing(page).locator("text").allTextContents();
    for (let i = 1; i <= option.n_inverters; i += 1) expect(words).toContain(`INV-${i}`);
    const inverterWords = `${general(inverter.pnom_kw)} kW · ${inverter.n_mppt} MPPT`;
    if (isDesktop(testInfo.project.name)) expect(words).toContain(inverterWords);
    else for (const part of inverterWords.split(" · ")) expect(words).toContain(part);

    let used = 0;
    for (let i = 1; i <= option.n_inverters; i += 1) {
      for (let j = 1; j <= inverter.n_mppt; j += 1) {
        const count = stringsOf(option, i, j).length;
        if (count === 0) {
          expect(words).toContain(`MPPT ${j} · not used`);
          continue;
        }
        used += 1;
        expect(words).toContain(`MPPT ${j} · DC`);
        if (i === 1) {
          await expect(block(page, j)).toHaveAttribute("aria-label", `MPPT ${j}, ${plural(count, "string", "strings")}`);
          await expect(block(page, j).locator("text")).toHaveText(`${count} × ${option.n_series} mod`);
        }
      }
    }
    await expect(blocks(page)).toHaveCount(used);
    for (const word of ["AC", "ACDB", "kWh", "Net meter"]) expect(words).toContain(word);
    if (isDesktop(testInfo.project.name)) expect(words).toEqual(expect.arrayContaining(["Grid /", "LT panel"]));
    else expect(words).toContain("Grid / LT panel");
    await expect(sld(page)).toContainText("The PNG is the engine's drawing on A4");
  });

  test("the list for screen readers says every inverter and every MPPT with its strings and its load", async ({ page }) => {
    const option = await theItem(page, "single-line-diagram", drawing);
    const list = sld(page).getByTestId("sld-list");

    await expect(list).toContainText(`INV-1 · ${general(option.answer.equipment.inverter.pnom_kw)} kW · ${option.answer.equipment.inverter.n_mppt} MPPT`);
    const strings = stringsOf(option, 1, 1);
    await expect(list).toContainText(`MPPT 1, ${plural(strings.length, "string", "strings")}: ${strings.join(" · ")} · ${loadWordsOf(loadOf(option, 1, 1))}`);
  });

  test("under the pointer, or under a finger, a block lifts and shows its strings then its load at its right; the pointer gone, or another tap, takes it away", async ({ page }, testInfo) => {
    const option = await theItem(page, "single-line-diagram", drawing);
    const target = block(page, 2);
    await target.scrollIntoViewIfNeeded();

    if (testInfo.project.use.hasTouch) await target.tap();
    else await target.hover();

    await expect(tooltip(page)).toHaveCount(1);
    await expect(tooltip(page)).toContainText(stringsOf(option, 1, 2).join(" · "));
    await expect(tooltip(page)).toContainText(loadWordsOf(loadOf(option, 1, 2)));
    const [tip, rect] = [(await tooltip(page).boundingBox())!, (await target.locator("rect").boundingBox())!];
    expect(Math.round(tip.x - (rect.x + rect.width))).toBe(8);
    expect(Math.abs(tip.y + tip.height / 2 - (rect.y + rect.height / 2))).toBeLessThanOrEqual(1);
    await expect(target.locator("rect")).toHaveCSS("filter", "brightness(1.14)");

    if (testInfo.project.use.hasTouch) await target.tap();
    else await page.mouse.move(0, 0);
    await expect(tooltip(page)).toHaveCount(0);
  });

  test("desktop: the focus shows the same as the pointer, and Escape takes it away", async ({ page }, testInfo) => {
    test.skip(Boolean(testInfo.project.use.hasTouch), "the keyboard's path is the desktop's");
    const option = await theItem(page, "single-line-diagram", drawing);
    await sld(page).evaluate((card) => card.scrollIntoView({ block: "center", behavior: "instant" }));

    await block(page, 3).focus();

    await expect(block(page, 3)).toBeFocused();
    await expect(tooltip(page)).toContainText(stringsOf(option, 1, 3).join(" · "));
    await page.keyboard.press("Escape");
    await expect(tooltip(page)).toHaveCount(0);
  });

  test("desktop: Download PNG saves the engine's drawing on A4, named after the design, a PNG of 2338 × 1654", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "Downloads are captured on desktop alone (decision 15).");
    await theItem(page, "single-line-diagram", drawing);
    await expect(previewAction(page)).toHaveAccessibleName("Download PNG");

    const download = page.waitForEvent("download");
    await previewAction(page).click();
    const file = await download;

    expect(file.suggestedFilename()).toMatch(/-single-line-diagram\.png$/);
    const bytes = readFileSync((await file.path())!);
    expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(bytes.subarray(12, 16).toString("latin1")).toBe("IHDR");
    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([2338, 1654]);
    await expect(toast(page)).toHaveCount(0);
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    await theItem(page, "single-line-diagram", drawing);

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the bill of materials (decision 7)", () => {
  const bom = (page: Page) => page.getByTestId("bom");

  test("the rows equal the run's bom, word for word, the quantities with a comma between thousands; the caption names the option; where it is in the report", async ({ page }, testInfo) => {
    const option = await theItem(page, "bill-of-materials", bom);
    const shown = rows(bom(page), testInfo.project.name);

    await expect(shown).toHaveCount(option.bom.length);
    for (const [index, line] of option.bom.entries()) {
      expect(await wordsOf(shown.nth(index), testInfo.project.name)).toEqual([line.item, line.spec, fixed(line.qty, 0), line.unit]);
    }
    await expect(bom(page)).toContainText(`The bill of materials of option ${option.letter}, as the engine lists it`);
    await expect(preview(page).getByText("In the report, page 5")).toBeVisible();
    await expect(copyAsTable(page)).not.toHaveAttribute("aria-disabled", "true");
  });

  test("Copy as table: the clipboard holds the table as text (desktop), and a toast says so, then leaves after its time", async ({ page, context }, testInfo) => {
    const option = await theItem(page, "bill-of-materials", bom);
    // The clipboard is granted to the context on desktop (decision 16); on touch sizes the toast alone is checked.
    const onDesktop = isDesktop(testInfo.project.name);
    if (onDesktop) await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await copyAsTable(page).click();

    if (onDesktop) {
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(bomTextOf(option));
      await expect(toast(page)).toContainText("Bill of materials copied as a table");
      await expect(toast(page).getByRole("img", { name: "Done" })).toBeVisible();
    } else {
      await expect(toast(page)).toContainText(/Bill of materials copied as a table|The table could not be copied/);
    }
    await expect(toast(page)).toHaveCount(0, { timeout: TOAST_STAYS + 15_000 });
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    await theItem(page, "bill-of-materials", bom);

    expect(await grave(page)).toEqual([]);
  });
});

test.describe("the DC cable schedule (decision 7)", () => {
  const schedule = (page: Page) => page.getByTestId("cable-schedule");
  const head = (page: Page, name: string) => schedule(page).getByRole("columnheader", { name });
  const longestOf = (option: Option) => option.cable_schedule.reduce((longest, row) => (row.length_m > longest.length_m ? row : longest));

  test("every string in the engine's order with the eight columns, then the total row with the count and the lengths' sum", async ({ page }, testInfo) => {
    const option = await theItem(page, "cable-schedule", schedule);
    const shown = rows(schedule(page), testInfo.project.name);

    await expect(shown).toHaveCount(option.cable_schedule.length + 1);
    for (const [index, row] of option.cable_schedule.entries()) {
      expect(await wordsOf(shown.nth(index), testInfo.project.name)).toEqual(scheduleLineOf(row));
    }
    const total = totalOf(option);
    if (isPhone(testInfo.project.name)) {
      // The card of the total shows its sum alone.
      expect(await wordsOf(shown.last(), testInfo.project.name)).toEqual([total[0], total[6]]);
    } else {
      expect(await wordsOf(shown.last(), testInfo.project.name)).toEqual(total);
      await expect(schedule(page).getByRole("columnheader")).toHaveText(["String", "Inverter", "MPPT", "Modules", "Voc cold (V)", "Isc (A)", "DC cable (m)", "Cable"]);
    }
    await expect(schedule(page)).toContainText(`The DC cable schedule of option ${option.letter}, in the engine's order, by string`);
    await expect(preview(page).getByText("In the report, page 5")).toBeVisible();
  });

  test("tablet and desktop: sorted by DC cable downwards the longest string is first and the total stays last; a third press gives the engine's order back", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the rows are cards, and nothing there changes the order.");
    const option = await theItem(page, "cable-schedule", schedule);
    const names = () => schedule(page).getByRole("rowheader");
    const length = head(page, "DC cable (m)");
    await expect(length).toHaveAttribute("aria-sort", "none");

    await length.getByRole("button").click();
    await expect(length).toHaveAttribute("aria-sort", "ascending");
    await length.getByRole("button").click();

    await expect(length).toHaveAttribute("aria-sort", "descending");
    await expect(names().first()).toHaveText(longestOf(option).string);
    await expect(names().last()).toHaveText(totalOf(option)[0]!);
    await expect(schedule(page)).toContainText("Sorted by DC cable (m), downwards. The order of the engine, by string, is the default");
    await expect(head(page, "Cable").getByRole("button")).toHaveCount(0);

    await length.getByRole("button").click();
    await expect(length).toHaveAttribute("aria-sort", "none");
    await expect(names()).toHaveText([...option.cable_schedule.map((row) => row.string), totalOf(option)[0]!]);
  });

  test("Copy as table copies what is shown in the order shown (desktop), and says so", async ({ page, context }, testInfo) => {
    const option = await theItem(page, "cable-schedule", schedule);
    const onDesktop = isDesktop(testInfo.project.name);
    if (onDesktop) {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await head(page, "DC cable (m)").getByRole("button").click();
      await head(page, "DC cable (m)").getByRole("button").click();
      await expect(head(page, "DC cable (m)")).toHaveAttribute("aria-sort", "descending");
    }

    await copyAsTable(page).click();

    if (onDesktop) {
      const lines = (await page.evaluate(() => navigator.clipboard.readText())).split("\n");
      const sorted = [...option.cable_schedule].sort((a, b) => b.length_m - a.length_m);
      expect(lines[0]).toBe("String\tInverter\tMPPT\tModules\tVoc cold (V)\tIsc (A)\tDC cable (m)\tCable");
      expect(lines.slice(1, -1)).toEqual(sorted.map((row) => scheduleLineOf(row).join("\t")));
      expect(lines.at(-1)).toBe(totalOf(option).join("\t"));
      await expect(toast(page)).toContainText("DC cable schedule copied as a table");
    } else {
      await expect(toast(page)).toContainText(/DC cable schedule copied as a table|The table could not be copied/);
    }
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    await theItem(page, "cable-schedule", schedule);

    expect(await grave(page)).toEqual([]);
  });
});
