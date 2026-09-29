import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// StatusMark, Card and Stat as docs/design/components.md and the mockups have them.

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("StatusMark", () => {
  test("a tick for what fits, with its words beside it", async ({ page }) => {
    const mark = example(page, "status-fits");

    await expect(mark).toContainText("Fits");
    await expect(mark.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(mark.locator("svg")).toHaveCSS("stroke", COLOUR.ok);
    await expect(mark.locator("svg")).toHaveCSS("stroke-width", "2.4px");
  });

  test("an exclamation mark in a circle for what does not, in the accent", async ({ page }) => {
    const mark = example(page, "status-note");

    await expect(mark).toContainText("Does not fit, with the reason");
    await expect(mark.locator("svg")).toHaveCSS("stroke", COLOUR.accent);
    await expect(mark.locator("svg circle")).toHaveCount(1);
  });

  test("without words beside it, the mark itself says them", async ({ page }) => {
    await expect(example(page, "status-fits-alone").getByRole("img", { name: "In target" })).toBeVisible();
    await expect(example(page, "status-note-alone").getByRole("img", { name: "Below the DC/AC target" })).toBeVisible();
  });

  test("there are two marks, and none is red or a cross", async ({ page }) => {
    const strokes = await page
      .locator('[data-testid^="kit-status-"] svg')
      .evaluateAll((marks) => [...new Set(marks.map((mark) => getComputedStyle(mark).stroke))].sort());

    expect(strokes).toEqual([COLOUR.accent, COLOUR.ok].sort());
  });
});

test.describe("Card", () => {
  test("raised: surface 1, a line around it, radius 18, padding 24", async ({ page }) => {
    const card = example(page, "card").getByTestId("card");

    await expect(card).toHaveCSS("background-color", COLOUR.surface1);
    await expect(card).toHaveCSS("border-top-color", COLOUR.line);
    await expect(card).toHaveCSS("border-radius", "18px");
    await expect(card).toHaveCSS("padding", "24px");
    await expect(card).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.28\) 0px 16px 40px/);
  });

  test("compact: radius 14, padding 14", async ({ page }) => {
    const card = example(page, "card-compact").getByTestId("card");

    await expect(card).toHaveCSS("border-radius", "14px");
    await expect(card).toHaveCSS("padding", "14px");
  });

  test("selected: the surface of a note, an accent line, a halo", async ({ page }) => {
    const card = example(page, "card-selected").getByTestId("card");

    await expect(card).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(card).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(card).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.14\) 0px 0px 0px 3px$/);
    await expect(card).not.toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.28\)/);
  });
});

test.describe("Stat", () => {
  test("a label, its value in mono, its unit after a space", async ({ page }, testInfo) => {
    const stat = example(page, "stat-cell");
    const size = testInfo.project.name === "tablet" ? "17px" : "16px";

    await expect(stat.getByRole("term")).toHaveText("DC capacity");
    await expect(stat.getByRole("term")).toHaveCSS("font-size", "12px");
    await expect(stat.getByRole("term")).toHaveCSS("color", COLOUR.text2);
    await expect(stat.getByRole("definition")).toHaveText("357.28 kWp");
    await expect(stat.getByRole("definition")).toHaveCSS("font-size", size);
    await expect(stat.getByRole("definition")).toHaveCSS("font-weight", "500");
    await expect(stat.getByRole("definition")).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(stat.getByText("kWp")).toHaveCSS("font-size", "12px");
    await expect(stat.getByText("kWp")).toHaveCSS("color", COLOUR.text2);
  });

  test("the lead value is in the display face: 26 px, 22 on phone", async ({ page }, testInfo) => {
    const value = example(page, "stat-lead").getByRole("definition");

    await expect(value).toHaveText("617.8 MWh");
    await expect(value).toHaveCSS("font-size", testInfo.project.name === "phone" ? "22px" : "26px");
    await expect(value).toHaveCSS("font-weight", "600");
    await expect(value).toHaveCSS("font-family", /Bricolage/i);
  });

  test("a mark may follow the value, and says what it means", async ({ page }) => {
    const stat = example(page, "stat-with-mark");

    await expect(stat.getByRole("definition")).toContainText("1.30");
    await expect(stat.getByRole("img", { name: "In target" })).toBeVisible();
  });

  test("a tile inside a card: flat, surface 2, radius 12", async ({ page }) => {
    const tile = example(page, "stat-tile").getByRole("term").first().locator("..");

    await expect(tile).toHaveCSS("background-color", COLOUR.surface2);
    await expect(tile).toHaveCSS("border-radius", "12px");
    await expect(tile).toHaveCSS("box-shadow", "none");
    await expect(tile).toHaveCSS("padding", "10px 14px");
  });

  test("numbers have figures of one width, so that a changing value does not jump", async ({ page }) => {
    await expect(example(page, "stat-cell").getByRole("definition")).toHaveCSS("font-variant-numeric", "tabular-nums");
  });
});
