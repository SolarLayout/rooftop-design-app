import type { Locator, Page } from "@playwright/test";
import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// The parts of the shell as docs/design/components.md (round 4) and the boards "Shell states", "Studio"
// on desktop, tablet and phone have them. Each part stands on the third page of the kit, in each state.

const NOTE_LINE = "rgb(58, 50, 32)";
const CHROME = "rgb(14, 18, 24)";
const WELL = "rgb(9, 12, 16)";
const CONTROL_ACTIVE = "rgb(35, 42, 54)";
const TEXT_3 = "rgb(124, 134, 150)";
const DIM = "rgba(5, 7, 10, 0.72)";

const isPhone = (projectName: string) => projectName === "phone";
const isTablet = (projectName: string) => projectName === "tablet";
const isDesktop = (projectName: string) => projectName === "desktop";

const last = (page: Page) => page.getByTestId("kit-last-pressed");
const boxOf = async (locator: Locator) => (await locator.boundingBox())!;

/** The values of the vitals as they are read: label, then value with its unit. */
async function valuesOf(vitals: Locator): Promise<string[][]> {
  return vitals.locator("dl > div").evaluateAll((cells) =>
    cells
      .filter((cell) => getComputedStyle(cell).display !== "none")
      .map((cell) => [cell.querySelector("dt")?.textContent ?? "", (cell.querySelector("dd")?.textContent ?? "").replace(/\s+/g, " ").trim()]),
  );
}

const DEMO = [
  ["Energy, year 1", "617.8 MWh"],
  ["DC capacity", "357.28 kWp"],
  ["AC capacity", "275 kW"],
  ["DC/AC", "1.30"],
  ["Modules", "638 of 790"],
  ["PR", "86.6 %"],
  ["Yield", "1,729 kWh/kWp"],
];
// On phone the row shows what matters most first.
const DEMO_ON_PHONE = [DEMO[0], DEMO[1], DEMO[3], DEMO[4], DEMO[2], DEMO[5], DEMO[6]];

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/shell"))?.status()).toBe(200);
});

test.describe("Vitals, the design", () => {
  test("the seven values, each with its label and its unit", async ({ page }, testInfo) => {
    const vitals = example(page, "vitals-design").getByRole("region", { name: "Design vitals" });

    const shown = await valuesOf(vitals);

    expect([...shown].sort()).toEqual([...DEMO].sort());
    if (!isPhone(testInfo.project.name)) expect(shown).toEqual(DEMO);
  });

  test("phone: the order of the row is energy, DC, DC/AC, modules, then the rest", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The row is of the phone.");
    const cells = example(page, "vitals-design").locator("dl > div");

    const fromTheLeft = await cells.evaluateAll((all) =>
      all
        .map((cell) => ({ label: cell.querySelector("dt")?.textContent ?? "", left: cell.getBoundingClientRect().left }))
        .sort((a, b) => a.left - b.left)
        .map((cell) => cell.label),
    );

    expect(fromTheLeft).toEqual(DEMO_ON_PHONE.map(([label]) => label));
  });

  test("the energy in the display face, the others in mono", async ({ page }, testInfo) => {
    const vitals = example(page, "vitals-design");
    const energy = vitals.locator("dd").filter({ hasText: "617.8" });
    const dc = vitals.locator("dd").filter({ hasText: "357.28" });

    await expect(energy).toHaveCSS("font-family", /Bricolage/i);
    await expect(energy).toHaveCSS("font-size", isPhone(testInfo.project.name) ? "22px" : "26px");
    await expect(dc).toHaveCSS("font-family", /Geist ?Mono/i);
    await expect(dc).toHaveCSS("font-size", isTablet(testInfo.project.name) ? "17px" : "16px");
    await expect(vitals.locator("dt").first()).toHaveCSS("color", COLOUR.text2);
  });

  test("DC/AC in target has a tick, and says so", async ({ page }) => {
    const mark = example(page, "vitals-design").getByRole("img", { name: "In target" });

    await expect(mark).toBeVisible();
    await expect(mark).toHaveCSS("stroke", COLOUR.ok);
  });

  test("DC/AC outside the target has an exclamation mark in the accent, and says why", async ({ page }) => {
    const mark = example(page, "vitals-outside-target").getByRole("img", { name: "Below the DC/AC target" });

    await expect(mark).toBeVisible();
    await expect(mark).toHaveCSS("stroke", COLOUR.accent);
    await expect(mark.locator("circle")).toHaveCount(1);
  });

  test("desktop: a floating bar of 78, cells divided by lines", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The bar is of the desktop.");
    const vitals = example(page, "vitals-design").getByRole("region", { name: "Design vitals" });

    expect((await boxOf(vitals)).height).toBe(78);
    await expect(vitals).toHaveCSS("background-color", COLOUR.surface1);
    await expect(vitals).toHaveCSS("border-radius", "16px");
    await expect(vitals).toHaveCSS("border-top-color", COLOUR.line);
    await expect(vitals).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 16px 40px/);
    await expect(vitals.locator("dl > div").nth(1)).toHaveCSS("border-left-color", COLOUR.line);
    await expect(vitals.locator("dl > div").nth(1)).toHaveCSS("border-left-width", "1px");
  });

  test("tablet: a grid of 4 by 2, cells 72 high", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The grid is of the tablet.");
    const vitals = example(page, "vitals-design").getByRole("region", { name: "Design vitals" });
    const cells = vitals.locator("dl > div");

    const tops = await cells.evaluateAll((all) => all.map((cell) => Math.round(cell.getBoundingClientRect().top)));
    const rows = [...new Set(tops)];

    expect(rows).toHaveLength(2);
    expect(tops.filter((top) => top === rows[0])).toHaveLength(4);
    expect(Math.round((await boxOf(cells.first())).height)).toBe(72);
    await expect(vitals).toHaveCSS("border-radius", "16px");
  });

  test("phone: one row of cards 64 high that scrolls sideways, and shows part of what comes next", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The row is of the phone.");
    const vitals = example(page, "vitals-design").getByRole("region", { name: "Design vitals" });
    const cards = vitals.locator("dl > div");

    expect(await vitals.evaluate((row) => row.scrollWidth > row.clientWidth)).toBe(true);
    await expect(vitals).toHaveCSS("overflow-x", "auto");
    expect((await boxOf(cards.first())).height).toBe(64);
    await expect(cards.first()).toHaveCSS("border-radius", "14px");
    await expect(cards.first()).toHaveCSS("background-color", COLOUR.surface1);

    const edge = (await boxOf(vitals)).x + (await boxOf(vitals)).width;
    const cut = await cards.evaluateAll(
      (all, right) => all.some((card) => card.getBoundingClientRect().left < right && card.getBoundingClientRect().right > right),
      edge,
    );
    expect(cut).toBe(true);
  });
});

test.describe("Vitals, by keyboard", () => {
  test("the keyboard stops at them, and on phone the arrows scroll the row", async ({ page }, testInfo) => {
    const vitals = example(page, "vitals-design").getByRole("region", { name: "Design vitals" });

    await vitals.focus();
    await expect(vitals).toBeFocused();
    if (!isPhone(testInfo.project.name)) return;

    await page.keyboard.press("ArrowRight");
    await expect.poll(() => vitals.evaluate((row) => row.scrollLeft)).toBeGreaterThan(0);
  });
});

test.describe("Vitals, the notes to review", () => {
  test("desktop and tablet: the last cell says how many, and what the first is about; it opens the notes", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the notes are in the top bar.");
    const cell = example(page, "vitals-design").getByRole("button", { name: "1 note to review" });

    await expect(cell).toContainText("Voc coefficient");
    await expect(cell).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(cell).toHaveCSS("border-left-color", NOTE_LINE);
    await expect(cell.locator("svg")).toHaveCSS("stroke", COLOUR.accent);

    await cell.click();
    await expect(last(page)).toHaveText("Last pressed: Open the notes");
  });

  test("phone: the row has no cell of the notes", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The row is of the phone.");

    await expect(example(page, "vitals-design").getByRole("button", { name: "1 note to review" })).toBeHidden();
  });

  test("nothing to review: a tick, and it says so", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the notes are in the top bar.");
    const cell = example(page, "vitals-nothing-to-review").getByRole("button", { name: "Nothing to review" });

    await expect(cell).toContainText("Every check of the design fits.");
    await expect(cell).toHaveCSS("background-color", COLOUR.transparent);
    await expect(cell.locator("svg")).toHaveCSS("stroke", COLOUR.ok);
  });
});

test.describe("Vitals, while the energy is updated", () => {
  test("every value of before stays, dimmed", async ({ page }) => {
    const vitals = example(page, "vitals-updating");

    expect([...(await valuesOf(vitals))].sort()).toEqual([...DEMO].sort());
    for (const value of await vitals.getByTestId("stat-value").all()) await expect(value).toHaveCSS("opacity", "0.55");
    await expect(vitals.locator("dt").first()).toHaveCSS("opacity", "1");
  });

  test("dimmed, a unit has the colour of its number, so that it can still be read", async ({ page }) => {
    await expect(example(page, "vitals-updating").getByText("kWp", { exact: true })).toHaveCSS("color", COLOUR.text);
    await expect(example(page, "vitals-design").getByText("kWp", { exact: true })).toHaveCSS("color", COLOUR.text2);
  });

  test("a ring of 16 turns beside the energy", async ({ page }) => {
    const energy = example(page, "vitals-updating").locator("dd").filter({ hasText: "617.8" });
    const ring = energy.locator("svg").first();

    await expect(ring).toHaveCSS("width", "16px");
    await expect(ring).toHaveCSS("animation-duration", "0.9s");
    await expect(ring).toHaveCSS("opacity", "1");
  });

  test("the last cell says the step of the engine and how far", async ({ page }) => {
    const cell = example(page, "vitals-updating").getByTestId("vitals-last");

    await expect(cell).toContainText("Updating energy");
    await expect(cell).toContainText("Computing hourly shading for every module");
    const ring = cell.getByRole("progressbar", { name: "Computing hourly shading for every module" });
    await expect(ring).toHaveAttribute("aria-valuenow", "62");
    await expect(ring).toHaveCSS("width", "20px");
  });

  test("it is told to a screen reader as it changes", async ({ page }) => {
    await expect(example(page, "vitals-updating").getByTestId("vitals-last")).toHaveAttribute("role", "status");
  });
});

test.describe("Vitals, the first load", () => {
  test("skeletons in the place of the seven values, and no value", async ({ page }) => {
    const vitals = example(page, "vitals-loading");

    await expect(vitals.getByTestId("skeleton")).toHaveCount(14);
    await expect(vitals.locator("dd")).toHaveCount(0);
  });

  test("the last cell says what is opened", async ({ page }) => {
    const cell = example(page, "vitals-loading").getByTestId("vitals-last");

    await expect(cell).toContainText("Opening Pune demo roof");
    await expect(cell).toContainText("Fitting modules on the roof");
  });
});

test.describe("Vitals, the run failed", () => {
  test("the last good values stay, not dimmed", async ({ page }) => {
    const vitals = example(page, "vitals-failed");

    expect([...(await valuesOf(vitals))].sort()).toEqual([...DEMO].sort());
    for (const value of await vitals.getByTestId("stat-value").all()) await expect(value).toHaveCSS("opacity", "1");
  });

  test("the last cell is a note, and opens the notes", async ({ page }) => {
    const cell = example(page, "vitals-failed").getByRole("button", { name: "Energy was not updated" });

    await expect(cell).toContainText("Values are of the design before · Try again");
    await expect(cell).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(cell.locator("svg")).toHaveCSS("stroke", COLOUR.accent);

    await cell.click();
    await expect(last(page)).toHaveText("Last pressed: Open the notes");
  });
});

test.describe("Vitals, before a system voltage", () => {
  test("the roof and the positions only, and what they would carry", async ({ page }) => {
    const shown = await valuesOf(example(page, "vitals-waiting"));

    expect(shown).toEqual([
      ["Roof", "3,600 m²"],
      ["Positions", "790 modules"],
      ["If all were used", "442.40 kWp"],
    ]);
  });

  test("what is waited for leads to the Strings lens", async ({ page }) => {
    const note = example(page, "vitals-waiting").getByTestId("vitals-last");

    await expect(note).toHaveAttribute("href", "/studio/strings");
    await expect(note).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(note.locator("svg").first()).toHaveCSS("stroke", COLOUR.accent);
  });

  test("tablet: three cells in a row, the note across the width under them, 72 high", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The grid is of the tablet.");
    const vitals = example(page, "vitals-waiting").getByRole("region", { name: "Design vitals" });
    const note = vitals.getByTestId("vitals-last");
    const cell = vitals.locator("dl > div").first();

    expect(Math.round((await boxOf(note)).width)).toBe(Math.round((await boxOf(vitals)).width) - 2);
    expect(Math.round((await boxOf(note)).height)).toBe(72);
    expect((await boxOf(note)).y).toBeGreaterThan((await boxOf(cell)).y);
  });

  test("phone: the note is the first card of the row", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The row is of the phone.");
    const vitals = example(page, "vitals-waiting").getByRole("region", { name: "Design vitals" });
    const note = vitals.getByTestId("vitals-last");

    expect((await boxOf(note)).x).toBeLessThan((await boxOf(vitals.locator("dl > div").first())).x);
    expect((await boxOf(note)).height).toBe(64);
    await expect(note).toHaveCSS("border-radius", "14px");
  });
});

test.describe("A status is a tick or an exclamation mark", () => {
  test("no mark of the shell is red or a cross", async ({ page }) => {
    const strokes = await page
      .locator('[data-testid^="kit-"] svg[role="img"]:not([aria-label="SolarLayout Rooftop"]), [data-testid^="kit-vitals"] button svg')
      .evaluateAll((marks) => [...new Set(marks.map((mark) => getComputedStyle(mark).stroke))].sort());

    expect(strokes).toEqual([COLOUR.accent, COLOUR.ok].sort());
  });
});

test.describe("Notes to review, the look", () => {
  test("the head: the title in the display face, the count in mono, a button to close", async ({ page }, testInfo) => {
    const panel = example(page, "notes").getByTestId("notes-panel");
    const title = panel.getByRole("heading", { name: "Notes to review" });

    await expect(title).toHaveCSS("font-family", /Bricolage/i);
    await expect(title).toHaveCSS("font-size", "22px");
    await expect(title).toHaveCSS("line-height", "28px");
    await expect(panel.getByTestId("notes-count")).toHaveText("2");
    await expect(panel.getByTestId("notes-count")).toHaveCSS("font-family", /Geist ?Mono/i);
    await expect(panel.getByTestId("notes-count")).toHaveCSS("font-size", "13px");
    const close = await boxOf(panel.getByRole("button", { name: "Close" }).and(panel.locator("[data-close]")));
    expect(close.width).toBe(isDesktop(testInfo.project.name) ? 38 : 44);
  });

  test("a note: its mark, what it is about, the reason in the words of the engine, where it belongs", async ({ page }) => {
    const note = example(page, "notes").getByRole("listitem").first();

    await expect(note).toHaveCSS("background-color", COLOUR.noteSurface);
    await expect(note).toHaveCSS("border-top-color", NOTE_LINE);
    await expect(note).toHaveCSS("border-radius", "12px");
    await expect(note).toHaveCSS("padding", "14px");
    await expect(note.locator("svg").first()).toHaveCSS("width", "20px");
    await expect(note.locator("svg").first()).toHaveCSS("stroke", COLOUR.accent);
    await expect(note.getByText("Voc coefficient", { exact: true })).toHaveCSS("font-weight", "500");
    const reason = note.getByText(/is outside the usual/);
    await expect(reason).toHaveText(
      "Voc coefficient −0.164 %/°C is outside the usual −0.35 to −0.20 %/°C for crystalline silicon. Check the datasheet and enter it if it differs.",
    );
    await expect(reason).toHaveCSS("color", COLOUR.text2);
    await expect(reason).toHaveCSS("font-size", "13px");
    await expect(note.getByText("Module · Array lens")).toHaveCSS("color", TEXT_3);
  });

  test("a note leads to where it can be answered", async ({ page }) => {
    const go = example(page, "notes").getByRole("link", { name: "Open Array" });

    await expect(go).toHaveAttribute("href", "/studio/array");
    await expect(go).toHaveCSS("background-color", COLOUR.control);
  });

  test("a run that failed can be tried again", async ({ page }) => {
    const note = example(page, "notes").getByRole("listitem").nth(1);

    await expect(note).toContainText("Energy was not updated");
    await expect(note).toContainText("The server cannot be reached. Check the connection and try again.");
    await expect(note).toContainText("The values shown are of the design before");

    await note.getByRole("button", { name: "Try again" }).click();
    await expect(last(page)).toHaveText("Last pressed: Try again");
  });

  test("the notes are 10 apart", async ({ page }) => {
    const notes = example(page, "notes").getByRole("listitem");
    const [first, second] = [await boxOf(notes.nth(0)), await boxOf(notes.nth(1))];

    expect(Math.round(second.y - (first.y + first.height))).toBe(10);
  });

  test("nothing to review: one row with a tick", async ({ page }) => {
    const panel = example(page, "notes-none").getByTestId("notes-panel");
    const row = panel.getByRole("listitem");

    await expect(panel.getByTestId("notes-count")).toHaveText("0");
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Nothing to review");
    await expect(row).toContainText("Every check of the design fits.");
    await expect(row).toHaveCSS("background-color", COLOUR.surface1);
    await expect(row.locator("svg")).toHaveCSS("stroke", COLOUR.ok);
    await expect(row.locator("svg")).toHaveCSS("width", "20px");
  });
});

test.describe("Notes to review, the drawer", () => {
  async function opened(page: Page) {
    const opener = page.getByRole("button", { name: "Open the notes" });
    await opener.scrollIntoViewIfNeeded();
    await opener.click();
    const drawer = page.getByRole("dialog", { name: "Notes to review" });
    await expect(drawer).toBeVisible();
    return { opener, drawer, panel: drawer.getByTestId("notes-panel") };
  }

  test("desktop and tablet: from the right, 384 wide, from under the top bar to the bottom", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone it is a bottom sheet.");
    const { panel } = await opened(page);
    const box = await boxOf(panel);
    const screen = page.viewportSize()!;
    const topBar = isDesktop(testInfo.project.name) ? 56 : 60;

    expect(box.width).toBe(384);
    expect(box.x + box.width).toBe(screen.width);
    expect(box.y).toBe(topBar);
    expect(box.height).toBe(screen.height - topBar);
    await expect(panel).toHaveCSS("background-color", CHROME);
    await expect(panel).toHaveCSS("border-left-color", COLOUR.line);
    await expect(panel).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) -16px 0px 40px/);
  });

  test("phone: a bottom sheet with its handle, over a dimmed screen", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The sheet is of the phone.");
    const { drawer, panel } = await opened(page);
    const box = await boxOf(panel);
    const screen = page.viewportSize()!;

    expect(box.width).toBe(screen.width);
    expect(Math.round(box.y + box.height)).toBe(screen.height);
    await expect(panel).toHaveCSS("border-top-left-radius", "22px");
    await expect(panel).toHaveCSS("background-color", CHROME);
    await expect(panel.getByTestId("grip")).toBeVisible();
    expect(await drawer.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toBe(DIM);
  });

  test("the focus goes in, and Escape gives it back", async ({ page }) => {
    const { opener, drawer } = await opened(page);

    await expect(drawer.getByRole("button", { name: "Close" }).and(drawer.locator("[data-close]"))).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("the button to close closes it", async ({ page }) => {
    const { drawer } = await opened(page);

    await drawer.getByRole("button", { name: "Close" }).and(drawer.locator("[data-close]")).click();

    await expect(drawer).toBeHidden();
  });

  test("a press beside it closes it", async ({ page }) => {
    const { drawer } = await opened(page);

    await page.mouse.click(10, 10);

    await expect(drawer).toBeHidden();
  });

  test("an action of a note closes it too", async ({ page }) => {
    const { drawer } = await opened(page);

    await drawer.getByRole("button", { name: "Try again" }).click();

    await expect(drawer).toBeHidden();
    await expect(last(page)).toHaveText("Last pressed: Try again");
  });
});

test.describe("Project switcher", () => {
  test("closed: the name of the design, and on desktop where it is", async ({ page }, testInfo) => {
    const trigger = example(page, "switcher").getByRole("button", { name: /Pune demo roof/ });

    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger.getByText("Pune demo roof")).toHaveCSS("font-weight", "500");
    await expect(trigger).toHaveCSS("background-color", COLOUR.transparent);
    expect((await boxOf(trigger)).height).toBe(isDesktop(testInfo.project.name) ? 40 : 44);

    const place = trigger.getByText("18.52° N · 73.86° E");
    if (isDesktop(testInfo.project.name)) {
      await expect(place).toHaveCSS("font-family", /Geist ?Mono/i);
      await expect(place).toHaveCSS("font-size", "12px");
      await expect(place).toHaveCSS("color", TEXT_3);
    } else {
      await expect(place).toBeHidden();
    }
  });

  test("open, as it looks: the trigger on surface 2, its chevron turned", async ({ page }) => {
    const trigger = example(page, "switcher-open").getByRole("button", { name: /Pune demo roof/ });

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveCSS("background-color", COLOUR.surface2);
    await expect(trigger).toHaveCSS("border-top-color", COLOUR.line);
  });

  test("the panel: this design with its state of saving, the designs on this device, the actions", async ({ page }) => {
    const menu = example(page, "switcher-open").getByTestId("project-menu");

    await expect(menu.getByText("This design")).toHaveCSS("text-transform", "uppercase");
    await expect(menu.getByText("This design")).toHaveCSS("color", TEXT_3);
    await expect(menu.getByTestId("this-design")).toContainText("Pune demo roof");
    await expect(menu.getByTestId("this-design")).toContainText("Not kept on this device");
    await expect(menu.getByTestId("this-design").locator("svg").first()).toHaveCSS("stroke", COLOUR.accent);
    await expect(menu.getByText("On this device", { exact: true })).toBeVisible();
    await expect(menu.getByText("Designs you save appear here.")).toHaveCSS("color", COLOUR.text2);
    await expect(menu.getByRole("menuitem")).toHaveText([
      "New designFind the roof",
      "Open a project.rtd",
      "Import a drawingKMZ, KML, DXF",
      "Save a copy.rtd",
      "Home",
    ]);
  });

  test("desktop: the panel is 340 wide, on surface 1, rows of 44", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "On phone and tablet it is a bottom sheet.");
    const menu = example(page, "switcher-open").getByTestId("project-menu");

    expect((await boxOf(menu)).width).toBe(340);
    await expect(menu).toHaveCSS("background-color", COLOUR.surface1);
    await expect(menu).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(menu).toHaveCSS("border-radius", "14px");
    await expect(menu).toHaveCSS("padding", "6px");
    await expect(menu).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 16px 40px/);
    expect((await boxOf(menu.getByRole("menuitem").first())).height).toBe(44);
    await expect(menu.getByRole("menuitem").first().locator("svg")).toHaveCSS("width", "18px");
  });

  test("Home leads home, New design to the map; what comes with a later phase is shown and cannot be used", async ({ page }) => {
    const menu = example(page, "switcher-open").getByTestId("project-menu");

    await expect(menu.getByRole("menuitem", { name: "Home" })).toHaveAttribute("href", "/");
    await expect(menu.getByRole("menuitem", { name: "New design" })).toHaveAttribute("href", "/find");
    for (const name of ["Open a project", "Save a copy"]) {
      const row = menu.getByRole("menuitem", { name });
      await expect(row).toHaveAttribute("aria-disabled", "true");
      await expect(row).toHaveCSS("opacity", "0.45");
    }
    // Import a drawing opens its dialog (Phase 5, step 13): it is a row that can be pressed.
    await expect(menu.getByRole("menuitem", { name: "Import a drawing" })).not.toHaveAttribute("aria-disabled", "true");
  });

  test("it opens, the focus goes to its first row, and Escape gives the focus back", async ({ page }) => {
    const trigger = example(page, "switcher").getByRole("button", { name: /Pune demo roof/ });
    await trigger.scrollIntoViewIfNeeded();

    await trigger.click();

    const menu = page.getByRole("menu", { name: "Project" }).and(page.locator("[popover] *"));
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("menuitem").first()).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("the arrows go through its rows, Home and End to the ends", async ({ page }) => {
    const trigger = example(page, "switcher").getByRole("button", { name: /Pune demo roof/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const rows = page.getByRole("menu", { name: "Project" }).and(page.locator("[popover] *")).getByRole("menuitem");

    await page.keyboard.press("ArrowDown");
    await expect(rows.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(rows.nth(4)).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(rows.nth(4)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(rows.nth(3)).toBeFocused();
    await page.keyboard.press("Home");
    await expect(rows.nth(0)).toBeFocused();
  });

  test("a row that cannot be used does nothing, and the panel stays", async ({ page }) => {
    const trigger = example(page, "switcher").getByRole("button", { name: /Pune demo roof/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const menu = page.getByRole("menu", { name: "Project" }).and(page.locator("[popover] *"));

    // The second row, Open a project, comes with a later phase.
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(menu).toBeVisible();
    await expect(page).toHaveURL(/\/kit\/shell$/);
  });

  test("phone and tablet: it is a bottom sheet", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "On desktop it floats under its trigger.");
    const trigger = example(page, "switcher").getByRole("button", { name: /Pune demo roof/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    const panel = page.locator("[popover]:popover-open");
    const screen = page.viewportSize()!;

    const box = await boxOf(panel);
    expect(box.width).toBe(screen.width);
    expect(Math.round(box.y + box.height)).toBe(screen.height);
    await expect(panel).toHaveCSS("background-color", CHROME);
  });
});

test.describe("State of saving", () => {
  test("saved: a dot of 7 in the colour of what fits, pulsing", async ({ page }) => {
    const state = example(page, "saving-saved");
    const dot = state.getByTestId("saving-mark");

    await expect(state).toContainText("Saved on this device");
    await expect(dot).toHaveCSS("width", "7px");
    await expect(dot).toHaveCSS("height", "7px");
    await expect(dot).toHaveCSS("background-color", COLOUR.ok);
    await expect(dot).toHaveCSS("animation-duration", "2.4s");
  });

  test("saving: a ring of 12 that turns", async ({ page }) => {
    const state = example(page, "saving-saving");

    await expect(state).toContainText("Saving");
    await expect(state.locator("svg")).toHaveCSS("width", "12px");
    await expect(state.locator("svg")).toHaveCSS("animation-duration", "0.9s");
  });

  test("not kept: a hollow dot, and it says so", async ({ page }) => {
    const state = example(page, "saving-not-kept");
    const dot = state.getByTestId("saving-mark");

    await expect(state).toContainText("Not kept on this device");
    await expect(dot).toHaveCSS("width", "7px");
    await expect(dot).toHaveCSS("background-color", COLOUR.transparent);
    await expect(dot).toHaveCSS("border-top-color", TEXT_3);
    await expect(dot).toHaveCSS("border-top-style", "solid");
    // Its line is the token of 1.5 px. The browser of the tests draws and reports it in whole pixels.
    expect(await dot.evaluate((element) => getComputedStyle(element).getPropertyValue("--border-dot"))).toBe("1.5px");
    await expect(dot).toHaveCSS("border-top-width", "1px");
  });

  test("the words in small, text 2", async ({ page }) => {
    const words = example(page, "saving-not-kept").getByText("Not kept on this device");

    await expect(words).toHaveCSS("font-size", "13px");
    await expect(words).toHaveCSS("color", COLOUR.text2);
  });

  test("could not be saved: a note, and a button that opens the notes", async ({ page }) => {
    const button = example(page, "saving-not-saved").getByRole("button", { name: "Not saved" });

    await expect(button.locator("svg")).toHaveCSS("stroke", COLOUR.accent);
    await expect(button.locator("svg")).toHaveCSS("width", "16px");

    await button.click();
    await expect(last(page)).toHaveText("Last pressed: Open the notes");
  });
});

test.describe("Present and Export", () => {
  test("Present is shown and cannot be used, and says why", async ({ page }) => {
    const present = example(page, "present").getByRole("button", { name: "Present" });

    await expect(present).toHaveAttribute("aria-disabled", "true");
    await expect(present).toHaveCSS("opacity", "0.45");
    await expect(present).toHaveCSS("box-shadow", "none");
    await expect(present).toHaveAccessibleDescription("Comes with Home and projects");

    await present.click({ force: true });
    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });

  test("Present takes the focus, so that the keyboard finds it", async ({ page }) => {
    const present = example(page, "present").getByRole("button", { name: "Present" });

    await present.focus();

    await expect(present).toBeFocused();
  });

  test("desktop: Present with its word; tablet: the icon alone, 44", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "The phone has no Present in its top bar.");
    const present = example(page, "present").getByRole("button", { name: "Present" });
    const box = await boxOf(present);

    if (isDesktop(testInfo.project.name)) {
      expect(box.height).toBe(36);
      expect(box.width).toBeGreaterThan(80);
    } else {
      expect([box.width, box.height]).toEqual([44, 44]);
    }
  });

  test("Export is the primary action, and leads to Handover", async ({ page }, testInfo) => {
    const go = example(page, "export").getByRole("link", { name: "Export" });
    const box = await boxOf(go);

    await expect(go).toHaveAttribute("href", "/handover/report");
    await expect(go).toHaveCSS("background-color", COLOUR.accent);
    await expect(go).toHaveCSS("color", COLOUR.accentInk);
    expect(box.height).toBe(isDesktop(testInfo.project.name) ? 36 : 44);
    if (isPhone(testInfo.project.name)) expect(box.width).toBe(44);
  });
});

test.describe("Workspace navigation", () => {
  test("desktop and tablet: three links in a well, the one of this workspace taken", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone it is the tab bar.");
    const nav = example(page, "workspaces").getByRole("navigation", { name: "Workspaces" });
    const links = nav.getByRole("link");

    await expect(links).toHaveText(["Studio", "Performance", "Handover"]);
    await expect(nav).toHaveCSS("background-color", WELL);
    await expect(nav).toHaveCSS("padding", "4px");
    await expect(nav).toHaveCSS("border-radius", isDesktop(testInfo.project.name) ? "12px" : "14px");
    await expect(links.nth(0)).toHaveAttribute("aria-current", "page");
    await expect(links.nth(0)).toHaveCSS("background-color", CONTROL_ACTIVE);
    await expect(links.nth(0)).toHaveCSS("color", COLOUR.text);
    await expect(links.nth(0)).toHaveCSS("font-weight", "500");
    await expect(links.nth(1)).not.toHaveAttribute("aria-current");
    await expect(links.nth(1)).toHaveCSS("color", COLOUR.text2);
    expect((await boxOf(links.nth(0))).height).toBe(isDesktop(testInfo.project.name) ? 32 : 36);
  });

  test("the Studio is entered at the lens that was opened last", async ({ page }) => {
    const nav = example(page, "workspaces").getByRole("navigation", { name: "Workspaces" }).or(
      example(page, "tabbar").getByRole("navigation", { name: "Workspaces" }),
    );

    await expect(nav.getByRole("link", { name: "Studio" }).first()).toHaveAttribute("href", "/studio/array");
    await expect(nav.getByRole("link", { name: "Performance" }).first()).toHaveAttribute("href", "/performance");
    await expect(nav.getByRole("link", { name: "Handover" }).first()).toHaveAttribute("href", "/handover/report");
  });

  test("tablet: a link takes the pointer 44 high", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The touch target is of the tablet.");
    const link = example(page, "workspaces").getByRole("link", { name: "Performance" });

    expect((await boxOf(link.getByTestId("target"))).height).toBe(44);
  });

  test("phone: a tab bar of 72, icons of 22 over their words, this workspace in the accent", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The tab bar is of the phone.");
    const bar = example(page, "tabbar").getByRole("navigation", { name: "Workspaces" });
    const links = bar.getByRole("link");

    expect((await boxOf(bar)).height).toBe(72);
    await expect(bar).toHaveCSS("background-color", CHROME);
    await expect(links).toHaveText(["Studio", "Performance", "Handover"]);
    await expect(links.nth(0)).toHaveAttribute("aria-current", "page");
    await expect(links.nth(0)).toHaveCSS("color", COLOUR.accent);
    await expect(links.nth(1)).toHaveCSS("color", COLOUR.text2);
    await expect(links.nth(0)).toHaveCSS("font-size", "12px");
    await expect(links.nth(0).locator("svg")).toHaveCSS("width", "22px");
    await expect(links.nth(0).locator("svg")).toHaveCSS("stroke-width", "1.7px");
    expect((await boxOf(links.nth(0))).height).toBeGreaterThanOrEqual(44);
  });

  test("desktop and tablet have no tab bar, the phone no links in its top bar", async ({ page }, testInfo) => {
    const inTheBar = example(page, "workspaces").getByRole("navigation", { name: "Workspaces" });
    const tabBar = example(page, "tabbar").getByRole("navigation", { name: "Workspaces" });

    if (isPhone(testInfo.project.name)) {
      await expect(inTheBar).toBeHidden();
      await expect(tabBar).toBeVisible();
    } else {
      await expect(inTheBar).toBeVisible();
      await expect(tabBar).toBeHidden();
    }
  });
});

test.describe("Lenses", () => {
  test("four links, the one of this lens taken, in the accent", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Lenses" }).and(page.locator(":visible")).first();
    const links = nav.getByRole("link");

    await expect(links).toHaveText(["Roof", "Array", "Sun", "Strings"]);
    await expect(links.nth(1)).toHaveAttribute("aria-current", "page");
    await expect(links.nth(1)).toHaveAttribute("href", "/studio/array");
    await expect(links.nth(1)).toHaveCSS("color", COLOUR.accent);
    await expect(links.nth(1)).toHaveCSS("background-color", CONTROL_ACTIVE);
    await expect(links.nth(1)).toHaveCSS("font-weight", "500");
    await expect(links.nth(0)).toHaveCSS("color", COLOUR.text2);
  });

  test("desktop: a rail of 72, items of 56 by 56, the icon of 20 over a label of 11", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The rail is of the desktop.");
    const nav = example(page, "lenses").getByRole("navigation", { name: "Lenses" });
    const item = nav.getByRole("link", { name: "Array" });
    const box = await boxOf(item);

    expect((await boxOf(nav)).width).toBe(72);
    await expect(nav).toHaveCSS("background-color", CHROME);
    expect([box.width, box.height]).toEqual([56, 56]);
    await expect(item).toHaveCSS("border-radius", "12px");
    await expect(item).toHaveCSS("font-size", "11px");
    await expect(item.locator("svg")).toHaveCSS("width", "20px");
    await expect(item.locator("svg")).toHaveCSS("stroke-width", "1.7px");
  });

  test("tablet: a row of 44, each with its icon of 18", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The row is of the tablet.");
    const nav = example(page, "lenses").getByRole("navigation", { name: "Lenses" });
    const item = nav.getByRole("link", { name: "Array" });

    expect((await boxOf(item)).height).toBe(44);
    await expect(nav).toHaveCSS("background-color", WELL);
    await expect(nav).toHaveCSS("border-radius", "14px");
    await expect(item).toHaveCSS("border-radius", "10px");
    await expect(item.locator("svg")).toHaveCSS("width", "18px");
  });

  test("phone: four columns of 44, words alone", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The switch is of the phone.");
    const nav = example(page, "lenses").getByRole("navigation", { name: "Lenses" });
    const links = nav.getByRole("link");
    const widths = await links.evaluateAll((all) => all.map((link) => Math.round(link.getBoundingClientRect().width)));

    expect(new Set(widths).size).toBe(1);
    expect((await boxOf(links.first())).height).toBe(44);
    await expect(nav).toHaveCSS("background-color", WELL);
    await expect(links.first().locator("svg")).toBeHidden();
  });
});

test.describe("Top bar", () => {
  test("its height: 56 on desktop and phone, 60 on tablet", async ({ page }, testInfo) => {
    const bar = example(page, "topbar").locator("header");

    expect((await boxOf(bar)).height).toBe(isTablet(testInfo.project.name) ? 60 : 56);
  });

  test("desktop and tablet: on chrome, with a line under it", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the top bar stands on the ground.");
    const bar = example(page, "topbar").locator("header");

    await expect(bar).toHaveCSS("background-color", CHROME);
    await expect(bar).toHaveCSS("border-bottom-width", "1px");
  });

  test("the name of the product: the logo, and on desktop its words", async ({ page }, testInfo) => {
    const bar = example(page, "topbar").locator("header");
    const words = bar.getByText("SolarLayout");

    await expect(bar.getByRole("img", { name: "SolarLayout Rooftop" })).toBeVisible();
    if (isDesktop(testInfo.project.name)) {
      await expect(words).toHaveCSS("font-family", /Bricolage/i);
      await expect(words).toHaveCSS("font-size", "17px");
    } else {
      await expect(words).toBeHidden();
    }
  });

  test("desktop: the state of saving is in the bar; tablet and phone: in the project switcher only", async ({ page }, testInfo) => {
    const state = example(page, "topbar").locator("header").getByText("Not kept on this device").and(page.locator(":visible"));

    await expect(state).toHaveCount(isDesktop(testInfo.project.name) ? 1 : 0);
  });

  test("phone: the notes have a button of their own, which says how many", async ({ page }, testInfo) => {
    const notes = example(page, "topbar").locator("header").getByRole("button", { name: "1 note to review" });

    if (!isPhone(testInfo.project.name)) {
      await expect(notes).toBeHidden();
      return;
    }
    expect([(await boxOf(notes)).width, (await boxOf(notes)).height]).toEqual([44, 44]);
    await expect(notes.locator("svg")).toHaveCSS("stroke", COLOUR.accent);
    await notes.click();
    await expect(last(page)).toHaveText("Last pressed: Open the notes");
  });

  test("phone: no Present; everywhere Export", async ({ page }, testInfo) => {
    const bar = example(page, "topbar").locator("header");

    await expect(bar.getByRole("link", { name: "Export" })).toBeVisible();
    if (isPhone(testInfo.project.name)) await expect(bar.getByRole("button", { name: "Present" })).toBeHidden();
    else await expect(bar.getByRole("button", { name: "Present" })).toBeVisible();
  });

  test("it is as wide as the screen", async ({ page }) => {
    const bar = await boxOf(example(page, "topbar").locator("header"));

    expect([bar.x, bar.width]).toEqual([0, page.viewportSize()!.width]);
  });

  test("the reference sizes have room for all of it", async ({ page }, testInfo) => {
    const bar = example(page, "topbar").locator("header");
    const name = bar.getByRole("button", { name: /Pune demo roof/ }).getByText("Pune demo roof");

    expect(await name.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    if (isDesktop(testInfo.project.name)) {
      await expect(bar.getByRole("button", { name: /Pune demo roof/ }).getByText("18.52° N · 73.86° E")).toBeVisible();
      await expect(bar.getByText("Not kept on this device").and(bar.locator(":visible"))).toBeVisible();
    }
    if (isTablet(testInfo.project.name)) {
      await expect(bar.getByRole("button", { name: "Present" })).toBeVisible();
      expect((await boxOf(bar.getByRole("link", { name: "Export" }))).width).toBeGreaterThan(80);
    }
  });

  test("desktop, where the room is short: the place and the state of saving go, the name stays whole", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "The words are of the desktop.");
    await page.setViewportSize({ width: 1101, height: 800 });
    const bar = example(page, "topbar").locator("header");
    const trigger = bar.getByRole("button", { name: /Pune demo roof/ });

    expect(await trigger.getByText("Pune demo roof").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(trigger.getByText("18.52° N · 73.86° E")).toBeHidden();
    await expect(bar.getByText("Not kept on this device").and(bar.locator(":visible"))).toHaveCount(0);
    await expect(bar.getByRole("button", { name: "Present" })).toBeVisible();
    await expect(bar.getByRole("link", { name: "Export" })).toContainText("Export");
  });

  test("tablet, where the room is short: Present and the word of Export go, the name stays", async ({ page }, testInfo) => {
    test.skip(!isTablet(testInfo.project.name), "The top bar of the tablet.");
    await page.setViewportSize({ width: 640, height: 900 });
    const bar = example(page, "topbar").locator("header");
    const name = bar.getByRole("button", { name: /Pune demo roof/ }).getByText("Pune demo roof");
    const go = bar.getByRole("link", { name: "Export" });

    expect((await boxOf(name)).width).toBeGreaterThanOrEqual(60);
    expect((await boxOf(go)).width).toBe(44);
    await expect(bar.getByRole("button", { name: "Present" })).toBeHidden();
    await expect(bar.getByRole("navigation", { name: "Workspaces" }).getByRole("link")).toHaveCount(3);
  });

  test("nothing of it is cut off or pushed out", async ({ page }) => {
    const bar = example(page, "topbar").locator("header");

    expect(await bar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
});
