import type { Page } from "@playwright/test";
import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// Dialog as docs/design/components.md ("Dialog") and the board "Controls, part 2" have it.

const DIM = "rgba(5, 7, 10, 0.72)";
const CHROME = "rgb(14, 18, 24)";
const TITLE = "Open another project?";
const TEXT = "Pune demo roof has changes that are not saved on this device. Save a copy first, or they are lost.";

const isPhone = (projectName: string) => projectName === "phone";
const heightOf = async (page: Page, name: string, within = page.locator("body")) =>
  (await within.getByRole("button", { name, exact: true }).boundingBox())!.height;

async function opened(page: Page) {
  const opener = page.getByRole("button", { name: "Open a project" });
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: TITLE });
  await expect(dialog).toBeVisible();
  return { opener, dialog, panel: dialog.getByTestId("dialog-panel") };
}

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("Dialog, the look", () => {
  test("desktop and tablet: a floating panel with round corners", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone it is a bottom sheet.");
    const panel = example(page, "dialog").getByTestId("dialog-panel");

    await expect(panel).toHaveCSS("background-color", COLOUR.surface1);
    await expect(panel).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(panel).toHaveCSS("border-radius", "22px");
    await expect(panel).toHaveCSS("padding", "22px 22px 20px");
    await expect(panel).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.55\) 0px 24px 64px/);
    expect((await panel.boundingBox())!.width).toBeLessThanOrEqual(440);
    expect((await panel.boundingBox())!.width).toBeGreaterThanOrEqual(340);
  });

  test("the title in the display face, the text in text 2", async ({ page }) => {
    const panel = example(page, "dialog").getByTestId("dialog-panel");
    const title = panel.getByRole("heading", { name: TITLE });

    await expect(title).toHaveCSS("font-size", "22px");
    await expect(title).toHaveCSS("line-height", "28px");
    await expect(title).toHaveCSS("font-family", /Bricolage/i);
    await expect(panel.getByText(TEXT)).toHaveCSS("color", COLOUR.text2);
  });

  test("desktop and tablet: the actions at the right, 8 apart, the primary one last; a button to close", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the actions are under each other.");
    const panel = example(page, "dialog").getByTestId("dialog-panel");
    const actions = panel.getByTestId("dialog-actions").getByRole("button");
    const [cancel, copy, open] = await Promise.all([0, 1, 2].map(async (index) => (await actions.nth(index).boundingBox())!));
    const inside = (await panel.boundingBox())!;

    await expect(actions).toHaveText(["Cancel", "Save a copy", "Open"]);
    expect(Math.round(copy.x - (cancel.x + cancel.width))).toBe(8);
    expect(Math.round(open.x - (copy.x + copy.width))).toBe(8);
    expect(Math.round(inside.x + inside.width - (open.x + open.width))).toBe(23);
    await expect(actions.nth(2)).toHaveCSS("background-color", COLOUR.accent);
    await expect(actions.nth(0)).toHaveCSS("background-color", COLOUR.transparent);
    expect(open.height).toBe(testInfo.project.name === "desktop" ? 40 : 44);

    const close = panel.getByRole("button", { name: "Close" });
    const side = testInfo.project.name === "desktop" ? 32 : 44;
    expect(await close.boundingBox()).toMatchObject({ width: side, height: side });
  });

  test("phone: a bottom sheet with the handle, the actions under each other, the primary one on top", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "On tablet and desktop it is a panel in the middle.");
    const panel = example(page, "dialog").getByTestId("dialog-panel");
    const top = async (name: string) => (await panel.getByRole("button", { name, exact: true }).boundingBox())!.y;

    await expect(panel).toHaveCSS("background-color", CHROME);
    await expect(panel).toHaveCSS("border-top-left-radius", "22px");
    await expect(panel).toHaveCSS("border-bottom-left-radius", "0px");
    await expect(panel).toHaveCSS("border-top-color", COLOUR.line);
    expect(await panel.getByTestId("grip").boundingBox()).toMatchObject({ width: 40, height: 4 });

    expect(await top("Open")).toBeLessThan(await top("Save a copy"));
    expect(await top("Save a copy")).toBeLessThan(await top("Cancel"));
    expect(await heightOf(page, "Open", panel)).toBe(48);
    expect(await heightOf(page, "Save a copy", panel)).toBe(48);
    expect(await heightOf(page, "Cancel", panel)).toBe(44);
    expect(Math.round((await panel.getByRole("button", { name: "Open", exact: true }).boundingBox())!.width)).toBe(
      Math.round((await panel.boundingBox())!.width) - 34,
    );
    // The handle closes; the button to close is of the panel on tablet and desktop.
    await expect(panel.getByRole("button", { name: "Close", exact: true })).toHaveCount(1);
  });
});

test.describe("Dialog", () => {
  test("a dialog with its title as name and its text as description, over a dimmed screen", async ({ page }) => {
    const { dialog } = await opened(page);

    await expect(dialog).toHaveAccessibleDescription(TEXT);
    expect(await dialog.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toBe(DIM);
    expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  });

  test("desktop and tablet: in the middle of the screen", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone it is a bottom sheet.");
    const { panel } = await opened(page);
    const box = (await panel.boundingBox())!;
    const screen = page.viewportSize()!;

    expect(Math.abs(box.x + box.width / 2 - screen.width / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.y + box.height / 2 - screen.height / 2)).toBeLessThanOrEqual(1);
  });

  test("phone: at the bottom of the screen, as wide as the screen", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "On tablet and desktop it is a panel in the middle.");
    const { panel } = await opened(page);
    const box = (await panel.boundingBox())!;
    const screen = page.viewportSize()!;

    expect(Math.round(box.width)).toBe(screen.width);
    expect(Math.round(box.y + box.height)).toBe(screen.height);
  });

  test("the focus goes in: to the first action, which changes nothing", async ({ page }) => {
    const { dialog } = await opened(page);

    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  });

  test("the focus stays in: it never reaches what is behind the dialog", async ({ page }) => {
    const { dialog } = await opened(page);
    // Between the last control and the first the focus is with the browser itself, on nothing of the page.
    const isInsideOrNowhere = () =>
      dialog.evaluate((element) => element.contains(document.activeElement) || document.activeElement === document.body);
    const reached = new Set<string>();

    for (const key of ["Tab", "Shift+Tab"]) {
      for (let stop = 0; stop < 12; stop += 1) {
        await page.keyboard.press(key);
        expect(await isInsideOrNowhere()).toBe(true);
        reached.add(await page.evaluate(() => document.activeElement?.textContent ?? ""));
      }
    }
    expect([...reached]).toEqual(expect.arrayContaining(["Cancel", "Save a copy", "Open"]));
  });

  test("what is behind it cannot be used, and does not scroll", async ({ page }) => {
    const { opener } = await opened(page);

    expect(await opener.evaluate((element) => element.matches(":is(dialog:modal *)") || document.querySelector("dialog:modal") !== null)).toBe(true);
    await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
    await opener.click({ force: true, timeout: 1000 }).catch(() => undefined);
    await expect(page.getByRole("dialog")).toHaveCount(1);
  });

  test("Escape closes it, and the focus goes back to where it was", async ({ page }) => {
    const { opener, dialog } = await opened(page);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Dialog, closed");
  });

  test("the button to close closes it", async ({ page }, testInfo) => {
    test.skip(isPhone(testInfo.project.name), "On phone the sheet has its handle.");
    const { opener, dialog } = await opened(page);

    await dialog.getByRole("button", { name: "Close" }).click();

    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("phone: a press on the handle closes it", async ({ page }, testInfo) => {
    test.skip(!isPhone(testInfo.project.name), "The handle is of the bottom sheet.");
    const { opener, dialog } = await opened(page);

    await dialog.getByRole("button", { name: "Close" }).click();

    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });

  test("an action acts, and the dialog goes", async ({ page }) => {
    const { opener, dialog } = await opened(page);

    await dialog.getByRole("button", { name: "Save a copy" }).click();

    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Dialog, Save a copy");
  });

  test("a press beside it leaves it open: what it asks must be answered", async ({ page }) => {
    const { dialog } = await opened(page);

    await page.mouse.click(5, 5);

    await expect(dialog).toBeVisible();
  });
});
