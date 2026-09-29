import type { Page } from "@playwright/test";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Tooltip and Toast as docs/design/components.md and the board "Controls, part 2" have them.

const CONTROL_ACTIVE = "rgb(35, 42, 54)";

const OPENED = new Date("2026-09-29T10:00:00");
const READY = new Date("2026-09-29T10:01:00");

/** Opens the page. With `clock` the time stands still once the page is there, and passes when the test says so. */
async function kit(page: Page, clock = false) {
  if (clock) await page.clock.install({ time: OPENED });
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
  if (clock) await page.clock.pauseAt(READY);
}

test.describe("Tooltip", () => {
  test("it looks as the board has it", async ({ page }) => {
    await kit(page);
    const tip = example(page, "tooltip-shown").getByRole("tooltip", { name: "Fit the roof to the view" });

    await expect(tip).toHaveCSS("background-color", CONTROL_ACTIVE);
    await expect(tip).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(tip).toHaveCSS("border-radius", "8px");
    await expect(tip).toHaveCSS("font-size", "12px");
    await expect(tip).toHaveCSS("padding-left", "10px");
    await expect(tip).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.35\) 0px 8px 20px/);
    expect((await tip.boundingBox())?.height).toBe(28);
  });

  test("it is 8 over its control, its middle over the middle of the control", async ({ page }) => {
    await kit(page, true);
    const control = example(page, "tooltip-with-key").getByRole("button", { name: "Fit" });
    await control.scrollIntoViewIfNeeded();

    await control.hover();
    await page.clock.runFor(410);
    const tip = page.getByRole("tooltip", { name: "Fit the roof to the view" }).and(page.locator("[popover]"));
    await expect(tip).toBeVisible();

    const [tipBox, controlBox] = [(await tip.boundingBox())!, (await control.boundingBox())!];
    expect(tipBox.height).toBe(28);
    expect(Math.round(controlBox.y - (tipBox.y + tipBox.height))).toBe(8);
    expect(Math.abs(tipBox.x + tipBox.width / 2 - (controlBox.x + controlBox.width / 2))).toBeLessThanOrEqual(1);
  });

  test("a key may follow, in mono 11 in a box", async ({ page }) => {
    await kit(page);
    const key = example(page, "tooltip-shown").getByRole("tooltip").getByText("F", { exact: true });

    await expect(key).toHaveCSS("font-size", "11px");
    await expect(key).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(key).toHaveCSS("border-radius", "4px");
    await expect(key).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(key).toHaveCSS("color", COLOUR.text2);
  });

  test("the control is described by it, and keeps its own name", async ({ page }) => {
    await kit(page);
    const control = example(page, "tooltip").getByRole("button", { name: "North up" });

    await expect(control).toHaveAccessibleDescription("North is up in the view");
  });

  test("under the pointer it comes after 400 ms, and goes when the pointer leaves", async ({ page }) => {
    await kit(page, true);
    const control = example(page, "tooltip").getByRole("button");
    const tip = page.getByRole("tooltip", { name: "North is up in the view" });
    await control.scrollIntoViewIfNeeded();

    await control.hover();
    await page.clock.runFor(390);
    await expect(tip).toBeHidden();
    await page.clock.runFor(20);
    await expect(tip).toBeVisible();

    await page.mouse.move(2, 2);
    await expect(tip).toBeHidden();
  });

  test("a pointer that only passes brings no tooltip", async ({ page }) => {
    await kit(page, true);
    const control = example(page, "tooltip").getByRole("button");
    await control.scrollIntoViewIfNeeded();

    await control.hover();
    await page.clock.runFor(200);
    await page.mouse.move(2, 2);
    await page.clock.runFor(1000);

    await expect(page.getByRole("tooltip", { name: "North is up in the view" })).toBeHidden();
  });

  test("with the keyboard focus it comes at once; Escape takes it away", async ({ page }) => {
    await kit(page, true);
    const tip = page.getByRole("tooltip", { name: "North is up in the view" });

    await page.getByRole("navigation", { name: "Pages of the kit" }).getByRole("link").last().focus();
    for (let stop = 0; stop < 40; stop += 1) {
      await page.keyboard.press("Tab");
      if (await example(page, "tooltip").getByRole("button").evaluate((button) => button === document.activeElement)) break;
    }
    await expect(example(page, "tooltip").getByRole("button")).toBeFocused();
    await expect(tip).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(tip).toBeHidden();
  });

  test("a press on the control takes it away", async ({ page }) => {
    await kit(page, true);
    const control = example(page, "tooltip").getByRole("button");
    const tip = page.getByRole("tooltip", { name: "North is up in the view" });
    await control.scrollIntoViewIfNeeded();

    await control.hover();
    await page.clock.runFor(410);
    await expect(tip).toBeVisible();
    await page.mouse.down();
    await expect(tip).toBeHidden();
    await page.mouse.up();
  });

  test("never on touch", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "The desktop of the tests has no touch.");
    await kit(page, true);
    const control = example(page, "tooltip").getByRole("button");
    await control.scrollIntoViewIfNeeded();

    await control.tap();
    await page.clock.runFor(1000);

    await expect(page.getByRole("tooltip", { name: "North is up in the view" })).toBeHidden();
  });
});

test.describe("Toast, the look", () => {
  test.beforeEach(async ({ page }) => {
    await kit(page);
  });

  test("floating, on surface 1, 48 high or more", async ({ page }) => {
    const toast = example(page, "toast-done").getByTestId("toast");

    await expect(toast).toHaveCSS("background-color", COLOUR.surface1);
    await expect(toast).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(toast).toHaveCSS("border-radius", "12px");
    await expect(toast).toHaveCSS("padding", "8px 8px 8px 14px");
    await expect(toast).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 16px 40px/);
    expect((await toast.boundingBox())?.height).toBe(48);
    await expect(toast.getByText("pune-demo-roof.rtd was saved")).toBeVisible();
  });

  test("something done has a tick, a note has the mark of a note; each says which it is", async ({ page }) => {
    const done = example(page, "toast-done").getByRole("img", { name: "Done" });
    const note = example(page, "toast-note").getByRole("img", { name: "Note" });

    await expect(done).toHaveCSS("color", COLOUR.ok);
    expect(await done.boundingBox()).toMatchObject({ width: 18, height: 18 });
    await expect(note).toHaveCSS("color", COLOUR.accent);
    expect(await note.boundingBox()).toMatchObject({ width: 20, height: 20 });
  });

  test("an action in accent; 32 high, 44 on touch", async ({ page }, testInfo) => {
    const undo = example(page, "toast-action").getByRole("button", { name: "Undo" });

    await expect(undo).toHaveCSS("color", COLOUR.accent);
    await expect(undo).toHaveCSS("font-weight", "500");
    await expect(undo).toHaveCSS("background-color", COLOUR.transparent);
    await expect(undo).toHaveCSS("border-radius", "8px");
    expect((await undo.boundingBox())?.height).toBe(isDesktop(testInfo.project.name) ? 32 : 44);
  });

  test("a note has a button to close it; 32, 44 on touch", async ({ page }, testInfo) => {
    const close = example(page, "toast-note").getByRole("button", { name: "Close" });
    const side = isDesktop(testInfo.project.name) ? 32 : 44;

    expect(await close.boundingBox()).toMatchObject({ width: side, height: side });
    await expect(example(page, "toast-note").getByTestId("toast")).toContainText("The map was not loaded. Enter the dimensions by hand.");
  });
});

test.describe("Toast, where toasts are shown", () => {
  const place = (page: Page) => page.getByRole("status", { name: "What was done" });

  test.beforeEach(async ({ page }) => {
    await kit(page, true);
  });

  test("the place is there before anything is said, and empty", async ({ page }) => {
    await expect(place(page)).toBeAttached();
    await expect(place(page).getByTestId("toast")).toHaveCount(0);
  });

  test("at the bottom of the screen in its middle, 24 from the edge, over everything", async ({ page }) => {
    await page.getByRole("button", { name: "Save the project" }).click();
    const toast = place(page).getByTestId("toast");
    const box = (await toast.boundingBox())!;
    const screen = page.viewportSize()!;

    expect(Math.round(box.y + box.height)).toBe(screen.height - 24);
    expect(Math.round(box.x + box.width / 2)).toBe(Math.round(screen.width / 2));
    await expect(place(page)).toHaveCSS("z-index", "40");
  });

  test("something done leaves after 5 s", async ({ page }) => {
    await page.getByRole("button", { name: "Save the project" }).click();
    const toast = place(page).getByTestId("toast");

    await expect(toast).toContainText("pune-demo-roof.rtd was saved");
    await page.clock.runFor(4900);
    await expect(toast).toBeVisible();
    await page.clock.runFor(200);
    await expect(toast).toHaveCount(0);
  });

  test("it stays under the pointer, and has 5 s again when the pointer left", async ({ page }) => {
    await page.getByRole("button", { name: "Save the project" }).click();
    const toast = place(page).getByTestId("toast");

    await toast.hover();
    await page.clock.runFor(20_000);
    await expect(toast).toBeVisible();

    await page.mouse.move(2, 2);
    await page.clock.runFor(4900);
    await expect(toast).toBeVisible();
    await page.clock.runFor(200);
    await expect(toast).toHaveCount(0);
  });

  test("it stays while the focus is inside", async ({ page }) => {
    await page.getByRole("button", { name: "Remove the stair room" }).click();
    const toast = place(page).getByTestId("toast");

    await toast.getByRole("button", { name: "Undo" }).focus();
    await page.clock.runFor(20_000);

    await expect(toast).toBeVisible();
  });

  test("its action acts and closes it", async ({ page }) => {
    await page.getByRole("button", { name: "Remove the stair room" }).click();

    await place(page).getByRole("button", { name: "Undo" }).click();

    await expect(place(page).getByTestId("toast")).toHaveCount(0);
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Undo, the stair room is back");
  });

  test("a note stays until it is closed", async ({ page }) => {
    await page.getByRole("button", { name: "Load the map" }).click();
    const toast = place(page).getByTestId("toast");

    await page.clock.runFor(60_000);
    await expect(toast).toContainText("The map was not loaded.");

    await toast.getByRole("button", { name: "Close" }).click();
    await expect(toast).toHaveCount(0);
  });

  test("one at a time, in the order they came", async ({ page }) => {
    await page.getByRole("button", { name: "Save the project" }).click();
    await page.getByRole("button", { name: "Remove the stair room" }).click();
    const toast = place(page).getByTestId("toast");

    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText("pune-demo-roof.rtd was saved");
    await page.clock.runFor(5100);
    await expect(toast).toHaveCount(1);
    await expect(toast).toContainText("Stair room was removed");
  });
});
