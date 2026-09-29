import { COLOUR, control, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Button and IconButton as docs/design/components.md and the board "Controls, depth and motion" have them.

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("Button", () => {
  test("primary: accent, raised, with the warm glow", async ({ page }) => {
    const button = control(page, "button-primary-rest");

    await expect(button).toHaveText("Export");
    await expect(button).toHaveCSS("background-color", COLOUR.accent);
    await expect(button).toHaveCSS("color", COLOUR.accentInk);
    await expect(button).toHaveCSS("font-weight", "600");
    await expect(button).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.24\) 0px 8px 22px/);
  });

  test("secondary: control surface, strong line, raised", async ({ page }) => {
    const button = control(page, "button-secondary-rest");

    await expect(button).toHaveCSS("background-color", COLOUR.control);
    await expect(button).toHaveCSS("border-top-color", COLOUR.lineStrong);
    await expect(button).toHaveCSS("border-top-width", "1px");
    await expect(button).toHaveCSS("color", COLOUR.text);
    await expect(button).toHaveCSS("font-weight", "500");
    await expect(button).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.25\) 0px 4px 12px/);
  });

  test("quiet: no surface, no shadow, secondary text", async ({ page }) => {
    const button = control(page, "button-quiet-rest");

    await expect(button).toHaveCSS("background-color", COLOUR.transparent);
    await expect(button).toHaveCSS("color", COLOUR.text2);
    await expect(button).toHaveCSS("box-shadow", "none");
  });

  test("the states of the board: hover is brighter and raised, pressed is darker and lowered", async ({ page }) => {
    await expect(control(page, "button-primary-hover")).toHaveCSS("background-color", COLOUR.accentHover);
    await expect(control(page, "button-primary-hover")).toHaveCSS("translate", "0px -1px");
    await expect(control(page, "button-primary-hover")).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.36\) 0px 12px 30px/);
    await expect(control(page, "button-primary-pressed")).toHaveCSS("background-color", COLOUR.accentPressed);
    await expect(control(page, "button-primary-pressed")).toHaveCSS("translate", "0px 1px");
    await expect(control(page, "button-primary-pressed")).toHaveCSS("scale", "0.985");

    await expect(control(page, "button-secondary-hover")).toHaveCSS("background-color", COLOUR.controlHover);
    await expect(control(page, "button-secondary-hover")).toHaveCSS("border-top-color", COLOUR.lineHover);
    await expect(control(page, "button-secondary-pressed")).toHaveCSS("background-color", COLOUR.controlPressed);
    await expect(control(page, "button-secondary-pressed")).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 2px 4px 0px inset/);

    await expect(control(page, "button-quiet-hover")).toHaveCSS("background-color", COLOUR.surface2);
    await expect(control(page, "button-quiet-hover")).toHaveCSS("color", COLOUR.text);
    await expect(control(page, "button-quiet-pressed")).toHaveCSS("background-color", COLOUR.controlPressed);
  });

  test("under the pointer it is as the board shows hover; pressed, as the board shows pressed", async ({
    page,
  }, testInfo) => {
    test.skip(!isDesktop(testInfo.project.name), "A touch screen has no pointer that hovers.");
    const button = control(page, "button-primary-rest");

    await button.hover();
    await expect(button).toHaveCSS("background-color", COLOUR.accentHover);
    await expect(button).toHaveCSS("translate", "0px -1px");

    await page.mouse.down();
    await expect(button).toHaveCSS("background-color", COLOUR.accentPressed);
    await expect(button).toHaveCSS("translate", "0px 1px");
    await page.mouse.up();
  });

  test("the keyboard reaches it, shows where it is, and presses it", async ({ page }) => {
    const button = control(page, "button-primary-rest");
    const pressed = page.getByTestId("kit-last-pressed");

    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await expect(button).toHaveCSS("outline-style", "solid");
    await expect(button).toHaveCSS("outline-width", "2px");
    await expect(button).toHaveCSS("outline-color", COLOUR.accent);
    await expect(button).toHaveCSS("outline-offset", "2px");

    await page.keyboard.press("Enter");
    await expect(pressed).toHaveText("Last pressed: Export, primary");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Space");
    await expect(pressed).toHaveText("Last pressed: Replace, secondary");
  });

  test("the focus ring is shown on the board as well", async ({ page }) => {
    await expect(control(page, "button-secondary-focus")).toHaveCSS("outline-style", "solid");
    await expect(control(page, "button-secondary-focus")).toHaveCSS("outline-color", COLOUR.accent);
  });

  test("disabled: dim, flat, and neither reached nor pressed", async ({ page }) => {
    const button = control(page, "button-primary-disabled");

    await expect(button).toBeDisabled();
    await expect(button).toHaveCSS("opacity", "0.45");
    await expect(button).toHaveCSS("box-shadow", "none");
    await expect(button).toHaveCSS("cursor", "default");

    await button.click({ force: true });
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("sizes: 36, 40, 44 and 56 on desktop; never under 44 on touch", async ({ page }, testInfo) => {
    const heights = isDesktop(testInfo.project.name) ? [36, 40, 44, 56] : [44, 44, 44, 56];
    const radii = isDesktop(testInfo.project.name) ? ["10px", "10px", "12px", "14px"] : ["12px", "12px", "12px", "14px"];

    for (const [index, size] of ["s", "m", "l", "xl"].entries()) {
      const button = control(page, `button-size-${size}`);
      expect((await button.boundingBox())?.height).toBe(heights[index]);
      await expect(button).toHaveCSS("border-radius", radii[index]);
    }
    await expect(control(page, "button-size-xl")).toHaveCSS("font-size", "16px");
  });

  test("with an icon: the icon is for the eye only, 8 px before the label", async ({ page }) => {
    const button = control(page, "button-with-icon");

    await expect(button).toHaveAccessibleName("Export");
    await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(button).toHaveCSS("column-gap", "8px");
  });

  test("a link that looks like a button is a link", async ({ page }) => {
    const link = control(page, "button-link", "link");

    await expect(link).toHaveAttribute("href", "/");
    await expect(link).toHaveCSS("background-color", COLOUR.accent);
  });
});

test.describe("IconButton", () => {
  test("has a name, and is square", async ({ page }, testInfo) => {
    const button = control(page, "icon-button-secondary");
    const side = isDesktop(testInfo.project.name) ? 38 : 44;

    await expect(button).toHaveAccessibleName("Next page");
    expect(await button.boundingBox()).toMatchObject({ width: side, height: side });
    await expect(button).toHaveCSS("background-color", COLOUR.control);
    await expect(button).toHaveCSS("border-top-color", COLOUR.line);
    await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
  });

  test("round: accent, a circle", async ({ page }) => {
    const button = control(page, "icon-button-round");
    const box = await button.boundingBox();

    await expect(button).toHaveAccessibleName("Play the day");
    await expect(button).toHaveCSS("background-color", COLOUR.accent);
    await expect(button).toHaveCSS("border-radius", "9999px");
    expect(box?.width).toBe(box?.height);
  });

  test("quiet: no surface", async ({ page }) => {
    await expect(control(page, "icon-button-quiet")).toHaveCSS("background-color", COLOUR.transparent);
    await expect(control(page, "icon-button-quiet")).toHaveAccessibleName("Undo");
  });

  test("on touch it is 44 by 44 at the least", async ({ page }, testInfo) => {
    test.skip(isDesktop(testInfo.project.name), "Touch sizes only.");

    for (const name of ["icon-button-secondary", "icon-button-round", "icon-button-quiet", "icon-button-primary"]) {
      const box = await control(page, name).boundingBox();
      expect(box?.width, name).toBeGreaterThanOrEqual(44);
      expect(box?.height, name).toBeGreaterThanOrEqual(44);
    }
  });
});
