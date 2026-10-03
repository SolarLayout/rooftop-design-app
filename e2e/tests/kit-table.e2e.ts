import type { Page } from "@playwright/test";
import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// Table as docs/design/components.md ("Table") and the board "Controls, part 2" have it.

const LINE_SUBTLE = "rgb(28, 34, 44)";
const TEXT_3 = "rgb(124, 134, 150)";

const isPhone = (projectName: string) => projectName === "phone";

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("Table, on tablet and desktop", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone each row is a card.");
  });

  test("a real table with its caption, its heads and the names of its rows", async ({ page }) => {
    const table = example(page, "table").getByRole("table", { name: "Stringing options at 1500 V" });

    await expect(table.getByRole("columnheader")).toHaveText(["Option", "Strings", "kWp", "DC/AC", "MWh"]);
    await expect(table.getByRole("rowheader")).toHaveText(["A", "B", "C", "D", "E"]);
    await expect(table.getByRole("row", { name: /^A / }).getByRole("cell")).toHaveText(["29 × 22", "357.28", "1.30", "617.8"]);
    await expect(table.locator("th[scope=col]")).toHaveCount(5);
    await expect(table.locator("th[scope=row]")).toHaveCount(5);
  });

  test("the head: 36 high, a section label in text 3, a line under it", async ({ page }) => {
    const head = example(page, "table").getByRole("columnheader", { name: "kWp" });

    expect((await head.boundingBox())?.height).toBe(36);
    await expect(head).toHaveCSS("font-size", "12px");
    await expect(head).toHaveCSS("font-weight", "500");
    await expect(head).toHaveCSS("text-transform", "uppercase");
    await expect(head).toHaveCSS("color", TEXT_3);
    await expect(head).toHaveCSS("border-bottom-color", COLOUR.line);
    await expect(head).toHaveCSS("padding-left", "8px");
    await expect(head).toHaveCSS("text-align", "right");
    await expect(example(page, "table").getByRole("columnheader", { name: "Strings" })).toHaveCSS("text-align", "left");
  });

  test("a row: 44 high, a subtle line under it, the name in medium, numbers at the right in mono 13", async ({ page }) => {
    const row = example(page, "table").getByRole("row", { name: /^B / });
    const number = row.getByRole("cell", { name: "349.44" });

    expect((await row.boundingBox())?.height).toBe(44);
    await expect(number).toHaveCSS("border-bottom-color", LINE_SUBTLE);
    await expect(number).toHaveCSS("text-align", "right");
    await expect(number).toHaveCSS("font-size", "13px");
    await expect(number).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(number).toHaveCSS("padding-right", "8px");
    await expect(row.getByRole("rowheader")).toHaveCSS("font-weight", "500");
    await expect(row.getByRole("rowheader")).toHaveCSS("text-align", "left");
  });

  test("a status mark of 16 after the number it belongs to, with its words", async ({ page }) => {
    const table = example(page, "table").getByRole("table");
    const fits = table.getByRole("row", { name: /^A / }).getByRole("img", { name: "In target" });
    const note = table.getByRole("row", { name: /^D / }).getByRole("img", { name: "Below the DC/AC target" });

    await expect(fits).toHaveCSS("color", COLOUR.ok);
    await expect(note).toHaveCSS("color", COLOUR.accent);
    expect(await fits.boundingBox()).toMatchObject({ width: 16, height: 16 });

    const number = (await table.getByRole("row", { name: /^A / }).getByText("1.30", { exact: true }).last().boundingBox())!;
    expect(Math.round((await fits.boundingBox())!.x - (number.x + number.width))).toBe(6);
  });

  test("the row that is chosen is on surface 2, and says that it is the one", async ({ page }) => {
    const table = example(page, "table").getByRole("table");

    await expect(table.getByRole("row", { name: /^A / })).toHaveCSS("background-color", COLOUR.surface2);
    await expect(table.getByRole("row", { name: /^A / })).toHaveAttribute("aria-current", "true");
    await expect(table.getByRole("row", { name: /^B / })).toHaveCSS("background-color", COLOUR.transparent);
    await expect(table.getByRole("row", { name: /^B / })).not.toHaveAttribute("aria-current");
  });

  test("the caption is under the table", async ({ page }) => {
    const table = example(page, "table").getByRole("table");
    const caption = table.locator("caption");
    const lastRow = (await table.getByRole("row").last().boundingBox())!;

    await expect(caption).toHaveCSS("font-size", "12px");
    await expect(caption).toHaveCSS("color", COLOUR.text2);
    expect((await caption.boundingBox())!.y).toBeGreaterThanOrEqual(lastRow.y + lastRow.height);
  });

  test("there are no cards", async ({ page }) => {
    await expect(example(page, "table").getByRole("list")).toBeHidden();
  });
});

test.describe("Table, on phone", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "On tablet and desktop it is a table.");
  });

  test("each row is a card; there is no table", async ({ page }) => {
    const cards = example(page, "table").getByRole("list", { name: "Stringing options at 1500 V" }).getByRole("listitem");

    await expect(example(page, "table").getByRole("table")).toBeHidden();
    await expect(cards).toHaveCount(5);
    await expect(cards.nth(3).getByRole("heading")).toHaveText("Option D");
  });

  test("a card: surface 2, the name as a title with its mark", async ({ page }) => {
    const card = example(page, "table").getByRole("listitem").nth(3);

    await expect(card).toHaveCSS("background-color", COLOUR.surface2);
    await expect(card).toHaveCSS("border-radius", "12px");
    await expect(card).toHaveCSS("padding", "14px");
    await expect(card.getByRole("heading")).toHaveCSS("font-size", "16px");
    await expect(card.getByRole("heading")).toHaveCSS("font-weight", "600");
    await expect(card.getByRole("img", { name: "Below the DC/AC target" })).toHaveCSS("color", COLOUR.accent);
  });

  test("the values as a list of three columns, the label over the value in mono 15", async ({ page }) => {
    const card = example(page, "table").getByRole("listitem").nth(3);
    const labels = card.locator("dt");
    const values = card.locator("dd");

    await expect(labels).toHaveText(["Strings", "Modules", "kWp", "DC/AC", "MWh"]);
    await expect(values).toHaveText(["26 × 27", "702", "393.12", "0.71", "700.9"]);
    await expect(labels.first()).toHaveCSS("font-size", "12px");
    await expect(labels.first()).toHaveCSS("color", COLOUR.text2);
    await expect(values.first()).toHaveCSS("font-size", "15px");
    await expect(values.first()).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);

    const [first, second, third, fourth] = await Promise.all([0, 1, 2, 3].map(async (index) => (await labels.nth(index).boundingBox())!));
    expect(first.y).toBe(second.y);
    expect(second.y).toBe(third.y);
    expect(fourth.y).toBeGreaterThan(first.y);
    expect(fourth.x).toBe(first.x);
  });

  test("the card of the row that is chosen says that it is the one", async ({ page }) => {
    const cards = example(page, "table").getByRole("listitem");

    await expect(cards.first()).toHaveAttribute("aria-current", "true");
    await expect(cards.first()).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(cards.nth(1)).not.toHaveAttribute("aria-current");
  });
});

test.describe("Table, heads that sort (components.md, \"Table\", sorting)", () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone each row is a card, and nothing there changes the order.");
  });

  const table = (page: Page) => example(page, "table-sortable").getByRole("table", { name: "Four strings and their DC cable" });
  const names = (page: Page) => table(page).getByRole("rowheader");
  const head = (page: Page, name: string) => table(page).getByRole("columnheader", { name, exact: true });

  test("a head that sorts is a button across the cell, 36 high; the one that does not is not", async ({ page }) => {
    const button = head(page, "DC cable (m)").getByRole("button");

    await expect(button).toHaveText("DC cable (m)");
    expect((await button.boundingBox())?.height).toBe(36);
    await expect(button).toHaveCSS("padding-left", "8px");
    await expect(button).toHaveCSS("color", TEXT_3);
    await expect(head(page, "Cable").getByRole("button")).toHaveCount(0);
    await expect(head(page, "Cable")).not.toHaveAttribute("aria-sort");
  });

  test("the order given at first, every head that sorts saying none", async ({ page }) => {
    await expect(names(page)).toHaveText(["S1", "S2", "S9", "S10"]);
    await expect(head(page, "String")).toHaveAttribute("aria-sort", "none");
    await expect(head(page, "DC cable (m)")).toHaveAttribute("aria-sort", "none");
  });

  test("a press sorts upwards, another downwards, a third gives the order back; the active head in text with its arrow", async ({ page }) => {
    const length = head(page, "DC cable (m)");

    await length.getByRole("button").click();
    await expect(names(page)).toHaveText(["S9", "S10", "S2", "S1"]);
    await expect(length).toHaveAttribute("aria-sort", "ascending");
    await expect(length.getByRole("button")).toHaveCSS("color", COLOUR.text);
    await expect(length.locator("svg")).toHaveCount(1);
    await expect(head(page, "String").getByRole("button")).toHaveCSS("color", TEXT_3);
    await expect(head(page, "String").locator("svg")).toHaveCount(0);

    await length.getByRole("button").click();
    await expect(names(page)).toHaveText(["S1", "S2", "S10", "S9"]);
    await expect(length).toHaveAttribute("aria-sort", "descending");

    await length.getByRole("button").click();
    await expect(names(page)).toHaveText(["S1", "S2", "S9", "S10"]);
    await expect(length).toHaveAttribute("aria-sort", "none");
    await expect(length.locator("svg")).toHaveCount(0);
  });

  test("a column sorts by its number, not by its words: S10 after S9 upwards; a press on another head sorts upwards by it", async ({ page }) => {
    await head(page, "MPPT").getByRole("button").click();
    await head(page, "MPPT").getByRole("button").click();
    await expect(names(page)).toHaveText(["S9", "S10", "S1", "S2"]);

    await head(page, "String").getByRole("button").click();
    await expect(names(page)).toHaveText(["S1", "S2", "S9", "S10"]);
    await expect(head(page, "String")).toHaveAttribute("aria-sort", "ascending");
    await expect(head(page, "MPPT")).toHaveAttribute("aria-sort", "none");
  });

  test("the keyboard reaches a head and sorts with Enter", async ({ page }) => {
    await head(page, "String").getByRole("button").focus();
    await page.keyboard.press("Enter");
    await expect(head(page, "String")).toHaveAttribute("aria-sort", "ascending");
    await page.keyboard.press("Enter");
    await expect(names(page)).toHaveText(["S10", "S9", "S2", "S1"]);
  });
});
