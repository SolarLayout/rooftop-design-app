import type { Page } from "@playwright/test";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Select and the list that floats, as docs/design/components.md ("Select") and the board "Controls,
// part 2" have them.

const DIM = "rgba(5, 7, 10, 0.72)";
const CHROME = "rgb(14, 18, 24)";

const last = (page: Page) => page.getByTestId("kit-last-pressed");

async function opened(page: Page) {
  const select = example(page, "select");
  await select.scrollIntoViewIfNeeded();
  const trigger = select.getByRole("button", { name: "Weather" });
  await trigger.click();
  const list = page.getByRole("listbox", { name: "Weather" }).and(page.locator("[popover] *"));
  await expect(list).toBeVisible();
  return { trigger, list, panel: page.locator("[popover]:popover-open") };
}

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("Select, the look", () => {
  test("the trigger: raised, its label in text 2, its value in medium, a chevron", async ({ page }, testInfo) => {
    const trigger = example(page, "select").getByRole("button", { name: "Weather" });

    await expect(trigger).toHaveText("WeatherPVGIS TMY");
    await expect(trigger).toHaveCSS("background-color", COLOUR.control);
    await expect(trigger).toHaveCSS("border-top-color", COLOUR.line);
    await expect(trigger).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.25\) 0px 4px 12px/);
    await expect(trigger.getByText("Weather", { exact: true })).toHaveCSS("color", COLOUR.text2);
    await expect(trigger.getByText("PVGIS TMY")).toHaveCSS("font-weight", "500");
    expect((await trigger.boundingBox())?.height).toBe(isDesktop(testInfo.project.name) ? 40 : 44);
    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("open, the trigger looks pressed", async ({ page }) => {
    const trigger = example(page, "select-open").getByRole("button", { name: "Weather" });

    await expect(trigger).toHaveCSS("background-color", COLOUR.controlPressed);
    await expect(trigger).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(trigger).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 2px 4px 0px inset/);
  });

  test("on desktop the list floats: surface 1, a strong line, rows 2 apart", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "On phone and tablet the list stands in a bottom sheet.");
    const list = example(page, "select-open").getByRole("listbox", { name: "Weather" });

    await expect(list).toHaveCSS("background-color", COLOUR.surface1);
    await expect(list).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(list).toHaveCSS("border-radius", "14px");
    await expect(list).toHaveCSS("padding", "6px");
    await expect(list).toHaveCSS("row-gap", "2px");
    await expect(list).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 16px 40px/);
  });

  test("a row: the choice that is taken has a tick in accent and is in medium; a fact at the right", async ({ page }, testInfo) => {
    const list = example(page, "select-open").getByRole("listbox");
    const taken = list.getByRole("option", { name: "PVGIS TMY" });
    const other = list.getByRole("option", { name: "CSV file" });

    await expect(taken).toHaveAttribute("aria-selected", "true");
    await expect(taken.getByText("PVGIS TMY")).toHaveCSS("font-weight", "500");
    await expect(taken.getByTestId("taken")).toHaveCSS("color", COLOUR.accent);
    expect(await taken.getByTestId("taken").boundingBox()).toMatchObject({ width: 16, height: 16 });
    await expect(taken.getByText("Typical year")).toHaveCSS("font-size", "12px");
    await expect(taken.getByText("Typical year")).toHaveCSS("color", "rgb(124, 134, 150)");

    await expect(other).toHaveAttribute("aria-selected", "false");
    await expect(other.getByText("CSV file")).toHaveCSS("font-weight", "400");
    await expect(other).toHaveCSS("border-radius", "8px");
    await expect(other).toHaveCSS("padding-left", "10px");
    expect((await other.boundingBox())?.height).toBe(isDesktop(testInfo.project.name) ? 40 : 52);
  });

  test("the row under the pointer or the keyboard is on surface 2", async ({ page }) => {
    const list = example(page, "select-open").getByRole("listbox");

    await expect(list.getByRole("option", { name: "NASA POWER" })).toHaveCSS("background-color", COLOUR.surface2);
    await expect(list.getByRole("option", { name: "CSV file" })).toHaveCSS("background-color", COLOUR.transparent);
  });

  test("one that cannot be used is dim and flat, and does not open", async ({ page }) => {
    const trigger = example(page, "select-disabled").getByRole("button", { name: "Weather" });

    await expect(trigger).toBeDisabled();
    await expect(trigger).toHaveCSS("opacity", "0.45");
    await expect(trigger).toHaveCSS("box-shadow", "none");
  });
});

test.describe("Select", () => {
  test("a press opens the list; the focus goes into it, the choice that is taken is marked", async ({ page }) => {
    const { trigger, list } = await opened(page);

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(list).toBeFocused();
    await expect(list.getByRole("option")).toHaveText(["PVGIS TMYTypical year", "NASA POWERThe year 2023", "CSV fileYour own hours"]);
    await expect(list).toHaveAttribute("aria-activedescendant", (await list.getByRole("option", { name: "PVGIS TMY" }).getAttribute("id"))!);
  });

  test("on desktop the list is under the trigger, 6 away, their left edges in line", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "On phone and tablet the list is a bottom sheet.");
    const { trigger, panel } = await opened(page);
    const [from, to] = [(await trigger.boundingBox())!, (await panel.boundingBox())!];

    expect(Math.round(to.y - (from.y + from.height))).toBe(6);
    expect(Math.round(to.x)).toBe(Math.round(from.x));
    expect(to.width).toBe(320);
  });

  test("on phone and tablet it is a bottom sheet over a dimmed screen", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "On desktop the list floats under the trigger.");
    const { panel } = await opened(page);
    const box = (await panel.boundingBox())!;
    const screen = page.viewportSize()!;

    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(screen.width);
    expect(Math.round(box.y + box.height)).toBe(screen.height);
    await expect(panel).toHaveCSS("background-color", CHROME);
    await expect(panel).toHaveCSS("border-top-left-radius", "22px");
    expect(await panel.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toBe(DIM);
    expect(await panel.getByTestId("grip").boundingBox()).toMatchObject({ width: 40, height: 4 });
  });

  test("on desktop the screen is not dimmed", async ({ page }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "On phone and tablet the screen is dimmed.");
    const { panel } = await opened(page);

    expect(await panel.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toBe(COLOUR.transparent);
  });

  test("the arrows go through the choices, Enter takes one, and the focus goes back", async ({ page }) => {
    const { trigger, list } = await opened(page);
    const nasa = list.getByRole("option", { name: "NASA POWER" });

    await page.keyboard.press("ArrowDown");
    await expect(list).toHaveAttribute("aria-activedescendant", (await nasa.getAttribute("id"))!);
    await expect(nasa).toHaveCSS("background-color", COLOUR.surface2);
    await expect(last(page)).toHaveText("Last pressed: nothing yet");

    await page.keyboard.press("Enter");
    await expect(list).toBeHidden();
    await expect(trigger).toHaveText("WeatherNASA POWER");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(last(page)).toHaveText("Last pressed: Weather, nasa");
  });

  test("Home and End, and the arrows stop at the ends", async ({ page }) => {
    const { list } = await opened(page);
    const idOf = async (name: string) => (await list.getByRole("option", { name }).getAttribute("id"))!;

    await page.keyboard.press("End");
    await expect(list).toHaveAttribute("aria-activedescendant", await idOf("CSV file"));
    await page.keyboard.press("ArrowDown");
    await expect(list).toHaveAttribute("aria-activedescendant", await idOf("CSV file"));
    await page.keyboard.press("Home");
    await expect(list).toHaveAttribute("aria-activedescendant", await idOf("PVGIS TMY"));
  });

  test("a letter leads to the choice that begins with it", async ({ page }) => {
    const { list } = await opened(page);

    await page.keyboard.press("c");

    await expect(list).toHaveAttribute("aria-activedescendant", (await list.getByRole("option", { name: "CSV file" }).getAttribute("id"))!);
  });

  test("Escape closes, gives the focus back and takes nothing", async ({ page }) => {
    const { trigger, list } = await opened(page);

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");

    await expect(list).toBeHidden();
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveText("WeatherPVGIS TMY");
    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });

  test("a press on a choice takes it", async ({ page }) => {
    const { trigger, list } = await opened(page);

    await list.getByRole("option", { name: "CSV file" }).click();

    await expect(list).toBeHidden();
    await expect(trigger).toHaveText("WeatherCSV file");
    await expect(last(page)).toHaveText("Last pressed: Weather, csv");
  });

  test("the choice that is taken already closes the list and changes nothing", async ({ page }) => {
    const { list } = await opened(page);

    await page.keyboard.press("Enter");

    await expect(list).toBeHidden();
    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });

  test("a press beside the list closes it", async ({ page }) => {
    const { list } = await opened(page);

    await page.mouse.click(5, 5);

    await expect(list).toBeHidden();
    await expect(last(page)).toHaveText("Last pressed: nothing yet");
  });

  test("the arrow down opens it from the trigger", async ({ page }) => {
    const trigger = example(page, "select").getByRole("button", { name: "Weather" });

    await trigger.focus();
    await page.keyboard.press("ArrowDown");

    await expect(page.getByRole("listbox", { name: "Weather" }).and(page.locator("[popover] *"))).toBeFocused();
  });
});
