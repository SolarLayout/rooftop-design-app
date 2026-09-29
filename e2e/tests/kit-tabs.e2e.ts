import type { Page } from "@playwright/test";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Tabs as the board "Tabs" (docs/design/mockups/Tabs.dc.html) and docs/design/components.md have them.

const TEXT_3 = "rgb(124, 134, 150)";

const last = (page: Page) => page.getByTestId("kit-last-pressed");
const tabs = (page: Page, name: string, label: string) => example(page, name).getByRole("tablist", { name: label });

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("Tabs, the look", () => {
  test("a row of tabs on a line, 4 apart", async ({ page }) => {
    const row = tabs(page, "tabs", "Performance");

    await expect(row.getByRole("tab")).toHaveText(["Losses", "Monthly", "25 years"]);
    await expect(row).toHaveCSS("column-gap", "4px");
    await expect(example(page, "tabs").getByTestId("tabs-line")).toHaveCSS("border-bottom-color", COLOUR.line);
    await expect(example(page, "tabs").getByTestId("tabs-line")).toHaveCSS("border-bottom-width", "1px");
  });

  test("a tab: 40 high and text 13 in text 2; on touch 44 and 15", async ({ page }, testInfo) => {
    const tab = tabs(page, "tabs", "Performance").getByRole("tab", { name: "Monthly" });
    const desktop = isDesktop(testInfo.project.name);

    expect((await tab.boundingBox())?.height).toBe(desktop ? 40 : 44);
    await expect(tab).toHaveCSS("font-size", desktop ? "13px" : "15px");
    await expect(tab).toHaveCSS("padding-left", desktop ? "14px" : "16px");
    await expect(tab).toHaveCSS("color", COLOUR.text2);
    await expect(tab).toHaveCSS("font-weight", "400");
    await expect(tab).toHaveCSS("background-color", COLOUR.transparent);
    await expect(tab.getByTestId("tab-line")).toHaveCSS("border-bottom-color", COLOUR.transparent);
  });

  test("the tab that is taken: text, medium, a line of 2 in accent on the line of the row", async ({ page }) => {
    const tab = tabs(page, "tabs", "Performance").getByRole("tab", { name: "Losses" });
    const line = tab.getByTestId("tab-line");
    const [mark, row] = [(await line.boundingBox())!, (await example(page, "tabs").getByTestId("tabs-line").boundingBox())!];

    await expect(tab).toHaveCSS("color", COLOUR.text);
    await expect(tab).toHaveCSS("font-weight", "500");
    await expect(line).toHaveCSS("border-bottom-color", COLOUR.accent);
    await expect(line).toHaveCSS("border-bottom-width", "2px");
    // The line of the tab ends where the line of the row ends: it lies on it.
    expect(Math.round(mark.y + mark.height)).toBe(Math.round(row.y + row.height));
  });

  test("the line of a tab is as wide as its words: the padding of the tab stays free", async ({ page }, testInfo) => {
    const tab = tabs(page, "tabs", "Performance").getByRole("tab", { name: "Losses" });
    const [outer, inner] = [(await tab.boundingBox())!, (await tab.getByTestId("tab-line").boundingBox())!];
    const side = isDesktop(testInfo.project.name) ? 14 : 16;

    expect(Math.round(inner.x - outer.x)).toBe(side);
    expect(Math.round(outer.x + outer.width - (inner.x + inner.width))).toBe(side);
  });

  test("under the pointer: text, and the line in the colour of a line under the pointer", async ({ page }) => {
    const tab = tabs(page, "tabs-hover", "Performance").getByRole("tab", { name: "Monthly" });

    await expect(tab).toHaveCSS("color", COLOUR.text);
    await expect(tab.getByTestId("tab-line")).toHaveCSS("border-bottom-color", COLOUR.lineHover);
    await expect(tab).toHaveCSS("font-weight", "400");
  });

  test("with the keyboard focus: the ring", async ({ page }) => {
    const tab = tabs(page, "tabs-focus", "Performance").getByRole("tab", { name: "Losses" });

    await expect(tab).toHaveCSS("outline-style", "solid");
    await expect(tab).toHaveCSS("outline-color", COLOUR.accent);
    await expect(tab).toHaveCSS("border-radius", "6px");
  });

  test("one that cannot be taken is dim", async ({ page }) => {
    const tab = tabs(page, "tabs-disabled", "Performance").getByRole("tab", { name: "25 years" });

    await expect(tab).toBeDisabled();
    await expect(tab).toHaveCSS("opacity", "0.45");
  });

  test("a count in mono 12 on surface 2", async ({ page }) => {
    const tab = tabs(page, "tabs-count", "Review").getByRole("tab", { name: "Notes" });
    const count = tab.getByText("2", { exact: true });

    await expect(count).toHaveCSS("font-size", "12px");
    await expect(count).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(count).toHaveCSS("font-weight", "400");
    await expect(count).toHaveCSS("background-color", COLOUR.surface2);
    await expect(count).toHaveCSS("color", COLOUR.text2);
    expect((await count.boundingBox())?.height).toBe(18);
  });

  test("the panel begins 16 under the row", async ({ page }) => {
    const shown = example(page, "tabs");
    const [row, panel] = [(await shown.getByTestId("tabs-line").boundingBox())!, (await shown.getByRole("tabpanel").boundingBox())!];

    expect(Math.round(panel.y - (row.y + row.height))).toBe(16);
  });

  test("there is no section label in the colour of the tabs: text 3 is for what cannot be pressed", async ({ page }) => {
    await expect(tabs(page, "tabs", "Performance").getByRole("tab", { name: "Monthly" })).not.toHaveCSS("color", TEXT_3);
  });
});

test.describe("Tabs", () => {
  test("a list of tabs and the panel of the one that is taken, each named by the other", async ({ page }) => {
    const shown = example(page, "tabs");
    const taken = shown.getByRole("tab", { name: "Losses" });
    const panel = shown.getByRole("tabpanel", { name: "Losses" });

    await expect(taken).toHaveAttribute("aria-selected", "true");
    await expect(shown.getByRole("tab", { name: "Monthly" })).toHaveAttribute("aria-selected", "false");
    await expect(taken).toHaveAttribute("aria-controls", (await panel.getAttribute("id"))!);
    await expect(panel).toHaveAttribute("aria-labelledby", (await taken.getAttribute("id"))!);
    await expect(panel).toContainText("The loss chain");
    await expect(shown.getByRole("tabpanel")).toHaveCount(1);
  });

  test("a press takes a tab and shows its panel", async ({ page }) => {
    const shown = example(page, "tabs");

    await shown.getByRole("tab", { name: "Monthly" }).click();

    await expect(shown.getByRole("tab", { name: "Monthly" })).toHaveAttribute("aria-selected", "true");
    await expect(shown.getByRole("tabpanel", { name: "Monthly" })).toContainText("Monthly energy");
    await expect(last(page)).toHaveText("Last pressed: Performance, monthly");
  });

  test("the keyboard stops at the row once, at the tab that is taken", async ({ page }) => {
    const row = tabs(page, "tabs", "Performance");

    await expect(row.getByRole("tab", { name: "Losses" })).toHaveAttribute("tabindex", "0");
    await expect(row.getByRole("tab", { name: "Monthly" })).toHaveAttribute("tabindex", "-1");
    await expect(row.getByRole("tab", { name: "25 years" })).toHaveAttribute("tabindex", "-1");
  });

  test("the arrows go to the neighbour and around the ends, and take the tab they go to", async ({ page }) => {
    const shown = example(page, "tabs");
    const tab = (name: string) => shown.getByRole("tab", { name });

    await tab("Losses").focus();
    await page.keyboard.press("ArrowRight");
    await expect(tab("Monthly")).toBeFocused();
    await expect(tab("Monthly")).toHaveAttribute("aria-selected", "true");
    await expect(shown.getByRole("tabpanel", { name: "Monthly" })).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(tab("Losses")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(tab("25 years")).toHaveAttribute("aria-selected", "true");
  });

  test("Home and End lead to the first and the last", async ({ page }) => {
    const shown = example(page, "tabs");

    await shown.getByRole("tab", { name: "Losses" }).focus();
    await page.keyboard.press("End");
    await expect(shown.getByRole("tab", { name: "25 years" })).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(shown.getByRole("tab", { name: "Losses" })).toHaveAttribute("aria-selected", "true");
  });

  test("the arrows up and down are left to the page", async ({ page }) => {
    const shown = example(page, "tabs");

    await shown.getByRole("tab", { name: "Losses" }).focus();
    await page.keyboard.press("ArrowDown");

    await expect(shown.getByRole("tab", { name: "Losses" })).toHaveAttribute("aria-selected", "true");
  });

  test("a tab that cannot be taken is passed over", async ({ page }) => {
    const shown = example(page, "tabs-disabled");

    await shown.getByRole("tab", { name: "Monthly" }).click();
    await page.keyboard.press("ArrowRight");

    await expect(shown.getByRole("tab", { name: "Losses" })).toHaveAttribute("aria-selected", "true");
  });

  test("Tab leads into the panel", async ({ page }) => {
    const shown = example(page, "tabs");

    await shown.getByRole("tab", { name: "Losses" }).focus();
    await page.keyboard.press("Tab");

    await expect(shown.getByRole("tabpanel", { name: "Losses" })).toBeFocused();
    await expect(shown.getByRole("tabpanel", { name: "Losses" })).toHaveCSS("outline-style", "solid");
  });

  test("a row that is too long scrolls sideways, and the page does not", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "On tablet and desktop the row of the kit has room.");
    const shown = example(page, "tabs-long");
    const row = shown.getByRole("tablist", { name: "Performance" });
    const scroller = shown.getByTestId("tabs-scroller");

    expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    await expect(scroller).toHaveCSS("overflow-x", "auto");
    await expect(scroller).toHaveCSS("scrollbar-width", "none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    // The tab that is taken is brought into view.
    await row.getByRole("tab", { name: "Summary" }).focus();
    await page.keyboard.press("End");
    await expect(row.getByRole("tab", { name: "Weather" })).toBeInViewport({ ratio: 1 });
  });
});
