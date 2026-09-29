import type { Locator, Page } from "@playwright/test";
import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// The bottom sheet of the phone as docs/design/components.md and StudioPhone.dc.html have it.

const CHROME = "rgb(14, 18, 24)";
const PEEK = 84;

const heightOf = async (locator: Locator) => Math.round((await locator.boundingBox())!.height);

async function sheetIn(page: Page, name: string) {
  const room = example(page, name).getByTestId("room");
  await room.scrollIntoViewIfNeeded();
  const sheet = room.getByRole("region", { name: "Inspector" });
  return { room, sheet, handle: sheet.getByRole("separator", { name: "Inspector" }) };
}

/** Drags the handle by `up` pixels, in steps, and holds it there. */
async function dragHandle(page: Page, handle: Locator, up: number) {
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - up, { steps: 5 });
}

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("Sheet", () => {
  test("chrome with round corners at the top, a line over it and the handle of 40 by 4", async ({ page }) => {
    const { sheet } = await sheetIn(page, "sheet");
    const grip = sheet.getByTestId("grip");

    await expect(sheet).toHaveCSS("background-color", CHROME);
    await expect(sheet).toHaveCSS("border-top-left-radius", "22px");
    await expect(sheet).toHaveCSS("border-top-right-radius", "22px");
    await expect(sheet).toHaveCSS("border-bottom-left-radius", "0px");
    await expect(sheet).toHaveCSS("border-top-color", COLOUR.line);
    await expect(sheet).toHaveCSS("border-top-width", "1px");

    expect(await grip.boundingBox()).toMatchObject({ width: 40, height: 4 });
    await expect(grip).toHaveCSS("background-color", COLOUR.lineStrong);
    expect(Math.round((await grip.boundingBox())!.y - (await sheet.boundingBox())!.y)).toBe(9);
  });

  test("it stands at the bottom of its room, as wide as the room", async ({ page }) => {
    const { room, sheet } = await sheetIn(page, "sheet");
    const [outer, inner] = [(await room.boundingBox())!, (await sheet.boundingBox())!];

    expect(Math.round(inner.y + inner.height)).toBe(Math.round(outer.y + outer.height) - 1);
    expect(Math.round(inner.width)).toBe(Math.round(outer.width) - 2);
  });

  test("three stops: peek, half the room, all of it", async ({ page }) => {
    const peek = await sheetIn(page, "sheet-peek");
    const half = await sheetIn(page, "sheet");
    const full = await sheetIn(page, "sheet-full");
    const room = (await heightOf(half.room)) - 2;

    expect(await heightOf(peek.sheet)).toBe(PEEK);
    expect(await heightOf(half.sheet)).toBe(Math.round(room / 2));
    expect(await heightOf(full.sheet)).toBe(room);
  });

  test("the handle is a separator that can be moved, with the stop in words", async ({ page }) => {
    const { handle } = await sheetIn(page, "sheet");

    await expect(handle).toHaveAttribute("aria-valuenow", "50");
    await expect(handle).toHaveAttribute("aria-valuemin", "0");
    await expect(handle).toHaveAttribute("aria-valuemax", "100");
    await expect(handle).toHaveAttribute("aria-valuetext", "Half open");
    await expect(handle).toHaveAttribute("aria-orientation", "horizontal");
    await expect(handle).toHaveAttribute("tabindex", "0");
  });

  test("the handle takes the pointer 44 high", async ({ page }) => {
    const { sheet } = await sheetIn(page, "sheet");

    expect(await heightOf(sheet.getByTestId("grip-target"))).toBe(44);
  });

  test("it can be moved by keyboard: arrows, Home and End, Enter", async ({ page }) => {
    const { handle } = await sheetIn(page, "sheet");
    const said = example(page, "sheet").getByTestId("stop");

    await handle.focus();
    await expect(handle).toHaveCSS("outline-style", "solid");

    await page.keyboard.press("ArrowUp");
    await expect(said).toHaveText("full");
    await expect(handle).toHaveAttribute("aria-valuetext", "Open");
    await page.keyboard.press("ArrowUp");
    await expect(said).toHaveText("full");

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(said).toHaveText("peek");
    await expect(handle).toHaveAttribute("aria-valuetext", "Closed");

    await page.keyboard.press("End");
    await expect(said).toHaveText("full");
    await page.keyboard.press("Home");
    await expect(said).toHaveText("peek");

    await page.keyboard.press("Enter");
    await expect(said).toHaveText("half");
    await page.keyboard.press("Space");
    await expect(said).toHaveText("full");
    await page.keyboard.press("Enter");
    await expect(said).toHaveText("peek");
  });

  test("it follows a drag, and goes to the nearest stop when it is let go", async ({ page }) => {
    const { room, sheet, handle } = await sheetIn(page, "sheet");
    const said = example(page, "sheet").getByTestId("stop");
    const before = await heightOf(sheet);

    await dragHandle(page, handle, 60);
    expect(await heightOf(sheet)).toBe(before + 60);
    await expect(said).toHaveText("half");

    await page.mouse.up();
    await expect(said).toHaveText("full");
    await expect.poll(() => heightOf(sheet)).toBe((await heightOf(room)) - 2);
  });

  test("a short drag lets it go back to where it was", async ({ page }) => {
    const { sheet, handle } = await sheetIn(page, "sheet");
    const said = example(page, "sheet").getByTestId("stop");
    const before = await heightOf(sheet);

    await dragHandle(page, handle, 20);
    await page.mouse.up();

    await expect(said).toHaveText("half");
    await expect.poll(() => heightOf(sheet)).toBe(before);
  });

  test("it never goes lower than peek nor higher than the room", async ({ page }) => {
    const { room, sheet, handle } = await sheetIn(page, "sheet");

    await dragHandle(page, handle, -600);
    expect(await heightOf(sheet)).toBe(PEEK);
    await page.mouse.up();
    await expect(example(page, "sheet").getByTestId("stop")).toHaveText("peek");

    await dragHandle(page, handle, 900);
    expect(await heightOf(sheet)).toBe((await heightOf(room)) - 2);
    await page.mouse.up();
    await expect(example(page, "sheet").getByTestId("stop")).toHaveText("full");
  });

  test("a press on the handle opens it one stop further", async ({ page }) => {
    const { handle } = await sheetIn(page, "sheet");
    const said = example(page, "sheet").getByTestId("stop");

    await handle.click();
    await expect(said).toHaveText("full");
    await handle.click();
    await expect(said).toHaveText("peek");
  });

  test("what is in it scrolls inside it", async ({ page }) => {
    const { sheet } = await sheetIn(page, "sheet");
    const inside = sheet.getByTestId("sheet-content");

    await expect(inside).toHaveCSS("overflow-y", "auto");
    expect(await inside.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
  });

  test("and by keyboard: the keyboard stops at what scrolls", async ({ page }) => {
    const { sheet, handle } = await sheetIn(page, "sheet");
    const inside = sheet.getByTestId("sheet-content");

    await handle.focus();
    await page.keyboard.press("Tab");
    await expect(inside).toBeFocused();
    await expect(inside).toHaveCSS("outline-style", "solid");

    await page.keyboard.press("End");
    await expect.poll(() => inside.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  });
});
