import type { Page, Request } from "@playwright/test";
import path from "node:path";
import { expect, test } from "../fixtures";

// The inverter of the Strings lens (plan/phase-07-plan.md, steps 17 to 20; the board "Inverter and sizing"): the
// inverter replaced from an OND, a file that is no OND refused in the engine's words; the current per MPPT and the
// AC cable per inverter in "Inverter limits and cabling"; the MPPT loading of the chosen option, with its limits
// and without; the verdict that counts the MPPT loads. Every number and every word of the engine is read from its
// answer, never written into the test.

const RUN = 90_000;
/** The demo's OND with its IMaxDC line taken out: no current limit per MPPT is known. */
const WITHOUT_IMAXDC = path.resolve(__dirname, "../fixtures/wattpower-without-imaxdc.OND");
const PAN = path.resolve(__dirname, "../fixtures/test-module.PAN");

type CurrentPerMppt = { value_a: number | null; source: string; note: string };
type Inverter = { manufacturer: string; model: string; source: string };
type MpptLoad = { label: string; inverter: number; mppt: number; strings: number; imp_a: number; imp_limit_a: number | null; isc_a: number; isc_limit_a: number | null; kwp: number; ok: boolean };
type Option = { key: string; letter: string; n_strings: number; ok: boolean; verdict: { ok: boolean; title: string; detail: string }; mppt_loads: MpptLoad[] };
type Answer = { equipment: { inverter: Inverter; max_current_per_mppt: CurrentPerMppt }; options_note: string | null; options: Option[]; chosen_option: string | null };

async function resultOf(request: Request): Promise<Answer> {
  const events = (await (await request.response())!.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => JSON.parse(line.slice(5)) as { type: string; result?: Answer });
  const done = events.find((event) => event.type === "result");
  if (!done?.result) throw new Error("The design run gave no result.");
  return done.result;
}

const ran = (page: Page, wanted: (body: Record<string, unknown>) => boolean = () => true) =>
  page.waitForRequest((request) => request.url().endsWith("/api/design") && wanted(request.postDataJSON()), { timeout: RUN });
const inverterCard = (page: Page) => page.getByTestId("inverter-card").filter({ visible: true });
const inverterName = (page: Page) => page.getByTestId("inverter-name").filter({ visible: true });
const inverterFile = (page: Page) => page.getByTestId("inverter-file").filter({ visible: true });

/** The Strings lens on the demo, its first run over. */
async function theStringsLens(page: Page): Promise<Answer> {
  const first = ran(page);
  await page.goto("/studio/strings");
  const answer = await resultOf(await first);
  await expect(inverterName(page)).toHaveText(answer.equipment.inverter.model, { timeout: RUN });
  return answer;
}

const one = (value: number) => value.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const limits = (page: Page) => page.getByRole("region", { name: "Inverter limits and cabling" }).filter({ visible: true });

/** Inverter limits and cabling, opened in place. */
async function limitsOpened(page: Page) {
  await limits(page).getByRole("button", { name: /Inverter limits and cabling/ }).click();
  await expect(limits(page).getByRole("textbox", { name: "Current per MPPT" })).toBeVisible();
  return limits(page);
}

const isPhone = (projectName: string) => projectName === "phone";
const mpptTable = (page: Page) => page.getByTestId("mppt-table").filter({ visible: true });
const chosenOf = (answer: Answer) => answer.options.find((option) => option.key === answer.chosen_option)!;
const ofItsLimit = (current: number, limit: number | null) => (limit === null ? `${one(current)} A` : `${one(current)} of ${one(limit)} A`);

/** The MPPT rows as shown: the rows of the table on tablet and desktop, the cards on phone. */
const mpptRows = (page: Page, projectName: string) =>
  isPhone(projectName) ? mpptTable(page).getByRole("listitem") : mpptTable(page).getByRole("table").getByRole("row").filter({ has: page.getByRole("rowheader") });

/** Each row says its MPPT and inverter, its strings, Imp and Isc of their limits and kWp, as the run's mppt_loads. */
async function rowsAreTheRuns(page: Page, projectName: string, loads: readonly MpptLoad[]) {
  const rows = mpptRows(page, projectName);
  await expect(rows).toHaveCount(loads.length, { timeout: RUN });
  for (const [index, load] of loads.entries()) {
    const row = rows.nth(index);
    if (isPhone(projectName)) await expect(row.getByRole("heading")).toHaveText(load.label);
    else await expect(row.getByRole("rowheader")).toHaveText(`MPPT ${load.mppt}INV-${load.inverter}`);
    await expect(row).toContainText(String(load.strings));
    await expect(row).toContainText(ofItsLimit(load.imp_a, load.imp_limit_a));
    await expect(row).toContainText(ofItsLimit(load.isc_a, load.isc_limit_a));
    await expect(row).toContainText(load.kwp.toFixed(2));
    const mark = load.imp_limit_a === null ? "Limit not known" : load.ok ? "Fits" : "Over the limit";
    await expect(row.getByRole("img", { name: mark })).toBeVisible();
  }
}

async function replaceDialogOpened(page: Page) {
  await inverterCard(page).getByRole("button", { name: "Replace" }).click();
  const dialog = page.getByRole("dialog", { name: "Replace the inverter" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe.configure({ timeout: RUN * 2 });

test.describe("replace the inverter", () => {
  test("with an OND: the request carries its text, the card shows the file's names, and the run's inverter is the file's", async ({ page }, testInfo) => {
    await theStringsLens(page);
    const dialog = await replaceDialogOpened(page);
    const read = page.waitForResponse((response) => response.url().endsWith("/api/equipment/inverter"), { timeout: RUN });
    const replaced = ran(page, (body) => body.ond_path === "wattpower-without-imaxdc.OND");

    await dialog.locator("input[type=file]").setInputFiles(WITHOUT_IMAXDC);

    const theFile = (await (await read).json()) as { inverter: Inverter };
    const request = await replaced;
    expect(request.postDataJSON().ond_text).toContain("PVObject_=pvGInverter");
    expect(request.postDataJSON().ond_text).not.toContain("IMaxDC=");
    expect(request.postDataJSON().imax_mppt_override).toBeNull();
    await expect(dialog).toBeHidden();
    await expect(inverterName(page)).toHaveText(theFile.inverter.model);
    await expect(inverterCard(page)).toContainText(theFile.inverter.manufacturer);
    await expect(inverterFile(page)).toHaveText("wattpower-without-imaxdc.OND");
    const answer = await resultOf(request);
    expect(answer.equipment.inverter.source).toBe("wattpower-without-imaxdc.OND");
    expect(answer.equipment.max_current_per_mppt.value_a).toBeNull();
    await expect(page.getByTestId("inverter-facts").filter({ visible: true })).toContainText("Current per MPPT not in the OND", { timeout: RUN });
    const chosen = chosenOf(answer);
    expect(chosen.mppt_loads.every((load) => load.imp_limit_a === null && !load.ok)).toBe(true);
    await expect(mpptRows(page, testInfo.project.name).first().getByRole("img", { name: "Limit not known" })).toBeVisible({ timeout: RUN });
  });

  test("a PAN given as an OND is refused in the engine's words, and the card keeps its inverter", async ({ page }) => {
    const answer = await theStringsLens(page);
    const runs: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/design")) runs.push(request.url());
    });
    const dialog = await replaceDialogOpened(page);
    const refused = page.waitForResponse((response) => response.url().endsWith("/api/equipment/inverter"), { timeout: RUN });

    await dialog.locator("input[type=file]").setInputFiles(PAN);

    const { error } = (await (await refused).json()) as { error: { message: string } };
    expect(error.message).toContain("test-module.PAN");
    await expect(dialog.getByRole("status")).toContainText("This file was not loaded");
    await expect(dialog.getByRole("status")).toContainText(error.message);
    await expect(dialog.getByRole("button", { name: "Choose another" })).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(inverterName(page)).toHaveText(answer.equipment.inverter.model);
    await expect(inverterFile(page)).toHaveText(answer.equipment.inverter.source);
    expect(runs).toEqual([]);
  });
});

test.describe("inverter limits and cabling", () => {
  test("closed, the row says the current per MPPT of the file and the cable; opened, where the current comes from and the API's note", async ({ page }) => {
    const answer = await theStringsLens(page);
    const current = answer.equipment.max_current_per_mppt;
    await expect(limits(page).getByTestId("limits-row")).toHaveText(`${one(current.value_a!)} A · 30 m`);

    const opened = await limitsOpened(page);

    await expect(opened.getByRole("textbox", { name: "Current per MPPT" })).toHaveValue("");
    await expect(opened).toContainText(`${one(current.value_a!)} A · IMaxDC`);
    await expect(opened.getByTestId("current-note")).toHaveText(current.note);
    await expect(opened.getByRole("textbox", { name: "AC cable per inverter" })).toHaveValue("30.00");
    await expect(opened).toContainText("1 to 2,000 m");
  });

  test("60 A entered: the run's options note says it, the card says entered; Use the file's gives it back", async ({ page }) => {
    const answer = await theStringsLens(page);
    const opened = await limitsOpened(page);
    const entered = ran(page, (body) => body.imax_mppt_override === 60);

    await opened.getByRole("textbox", { name: "Current per MPPT" }).fill("60");
    await opened.getByRole("textbox", { name: "Current per MPPT" }).press("Enter");

    const after = await resultOf(await entered);
    expect(after.options_note).toContain("60.0 A");
    await expect(page.getByTestId("options-note").filter({ visible: true })).toContainText(after.options_note!.split(" ! ")[0]!, { timeout: RUN });
    await expect(page.getByTestId("inverter-facts").filter({ visible: true })).toContainText("60.0 A per MPPT, entered");
    await expect(opened).toContainText("entered");
    await expect(opened.getByTestId("current-note")).toHaveCount(0);
    await expect(limits(page).getByTestId("limits-row")).toHaveText("60.0 A · 30 m");

    const givenBack = ran(page, (body) => body.imax_mppt_override === null);
    await opened.getByRole("button", { name: `Use the file's ${one(answer.equipment.max_current_per_mppt.value_a!)} A` }).click();
    const back = await resultOf(await givenBack);
    expect(back.options_note).toBe(answer.options_note);
    await expect(page.getByTestId("inverter-facts").filter({ visible: true })).not.toContainText("entered", { timeout: RUN });
    await expect(opened.getByRole("textbox", { name: "Current per MPPT" })).toHaveValue("");
  });

  test("the AC cable entered at 40 m reaches the run's request", async ({ page }) => {
    await theStringsLens(page);
    const opened = await limitsOpened(page);
    const entered = ran(page, (body) => body.ac_cable_m === 40);

    await opened.getByRole("textbox", { name: "AC cable per inverter" }).fill("40");
    await opened.getByRole("textbox", { name: "AC cable per inverter" }).press("Enter");

    await entered;
    await expect(limits(page).getByTestId("limits-row")).toContainText("· 40 m");
  });
});

test.describe("the MPPT loading", () => {
  test("of the chosen option: a row for each MPPT, as the run's mppt_loads, under the options with its caption", async ({ page }, testInfo) => {
    const answer = await theStringsLens(page);
    const chosen = chosenOf(answer);

    await expect(mpptTable(page)).toContainText(`of option ${chosen.letter}`);
    await rowsAreTheRuns(page, testInfo.project.name, chosen.mppt_loads);
    await expect(mpptTable(page)).toContainText(`Option ${chosen.letter}: ${chosen.n_strings} strings on ${chosen.mppt_loads.length} MPPT, at 1500 V`);
    await expect(mpptTable(page).getByTestId("mppt-note")).toHaveCount(0);
  });

  test("follows the option chosen, from the run's answer", async ({ page }, testInfo) => {
    const answer = await theStringsLens(page);
    const other = answer.options.find((option) => option.key !== answer.chosen_option)!;

    await page.getByTestId("option-card").filter({ visible: true }).filter({ has: page.getByText(other.letter, { exact: true }) }).click();

    await expect(mpptTable(page)).toContainText(`of option ${other.letter}`);
    await rowsAreTheRuns(page, testInfo.project.name, other.mppt_loads);
  });

  test("the demo's OND without IMaxDC: every row not known, the API's note under the table, and the way to the current per MPPT", async ({ page }, testInfo) => {
    await theStringsLens(page);
    const dialog = await replaceDialogOpened(page);
    const replaced = ran(page, (body) => body.ond_path === "wattpower-without-imaxdc.OND");
    await dialog.locator("input[type=file]").setInputFiles(WITHOUT_IMAXDC);
    const answer = await resultOf(await replaced);
    const chosen = chosenOf(answer);

    await rowsAreTheRuns(page, testInfo.project.name, chosen.mppt_loads);
    const note = mpptTable(page).getByTestId("mppt-note");
    await expect(note).toContainText(answer.equipment.max_current_per_mppt.note);

    await note.getByRole("button", { name: "Enter the current per MPPT" }).click();

    await expect(limits(page).getByRole("textbox", { name: "Current per MPPT" })).toBeFocused();
  });
});

test.describe("the verdict counts the MPPT loads", () => {
  test("without a current limit every option is not ok in the run's words, and its card has a note", async ({ page }) => {
    await theStringsLens(page);
    const dialog = await replaceDialogOpened(page);
    const replaced = ran(page, (body) => body.ond_path === "wattpower-without-imaxdc.OND");
    await dialog.locator("input[type=file]").setInputFiles(WITHOUT_IMAXDC);
    const answer = await resultOf(await replaced);

    expect(answer.options.every((option) => !option.verdict.ok)).toBe(true);
    const cards = page.getByTestId("option-card").filter({ visible: true });
    await expect(cards).toHaveCount(answer.options.length, { timeout: RUN });
    for (const [index, option] of answer.options.entries()) {
      await expect(cards.nth(index).getByRole("img")).not.toHaveAccessibleName(/^(In target|Fits)/);
      if (option.ok) await expect(cards.nth(index).getByRole("img", { name: "Over the current of an MPPT, or its limit not known: see the MPPT loading" })).toBeVisible();
    }
    const verdict = page.getByTestId("series-verdict").filter({ visible: true });
    await expect(verdict).toContainText(chosenOf(answer).verdict.detail.split(". ").at(-1)!);
  });
});
