import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// NumberField and Stepper as docs/design/components.md and the mockups have them.

const WELL = "rgb(9, 12, 16)";

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("NumberField", () => {
  test("recessed, with its label, its value in mono and its unit", async ({ page }) => {
    const field = example(page, "number-field");
    const input = field.getByRole("textbox", { name: "Setback" });

    await expect(input).toHaveValue("1.00");
    await expect(input).toHaveCSS("text-align", "right");
    await expect(input).toHaveCSS("font-weight", "500");
    await expect(input).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(input).toHaveAttribute("inputmode", "decimal");
    await expect(field.getByText("m", { exact: true })).toHaveCSS("color", COLOUR.text2);
    await expect(field.getByText("m", { exact: true })).toHaveCSS("font-size", "12px");

    const well = field.getByTestId("well");
    await expect(well).toHaveCSS("background-color", WELL);
    await expect(well).toHaveCSS("border-top-color", COLOUR.line);
    await expect(well).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.65\) 0px 1px 3px 0px inset/);
    expect((await well.boundingBox())?.height).toBe(44);
  });

  test("with the focus: an accent line and a halo, and no ring of its own", async ({ page }) => {
    const field = example(page, "number-field");
    const well = field.getByTestId("well");

    await field.getByRole("textbox").focus();

    await expect(well).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(well).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.18\) 0px 0px 0px 3px/);
    await expect(field.getByRole("textbox")).toHaveCSS("outline-style", "none");
  });

  test("the board shows the focus without the keyboard", async ({ page }) => {
    await expect(example(page, "number-field-focus").getByTestId("well")).toHaveCSS("border-top-color", COLOUR.accent);
  });

  test("a press on the label or the unit leads into the field", async ({ page }) => {
    const field = example(page, "number-field");

    await field.getByText("Setback").click();
    await expect(field.getByRole("textbox")).toBeFocused();
  });

  test("what is typed is a draft: nothing is committed on a key", async ({ page }) => {
    const input = example(page, "number-field").getByRole("textbox");
    const last = page.getByTestId("kit-last-pressed");

    await input.fill("1.2");
    await input.pressSequentially("5");

    await expect(input).toHaveValue("1.25");
    await expect(last).toHaveText("Last pressed: nothing yet");
  });

  test("Enter commits, once", async ({ page }) => {
    const input = example(page, "number-field").getByRole("textbox");
    const last = page.getByTestId("kit-last-pressed");

    await input.fill("1.25");
    await input.press("Enter");
    await expect(last).toHaveText("Last pressed: Setback, 1.25, commit 1");

    await input.press("Enter");
    await input.blur();
    await expect(last).toHaveText("Last pressed: Setback, 1.25, commit 1");
  });

  test("leaving the field commits", async ({ page }) => {
    const input = example(page, "number-field").getByRole("textbox");

    await input.fill("2");
    await input.blur();

    await expect(input).toHaveValue("2.00");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Setback, 2, commit 1");
  });

  test("Escape gives the draft up", async ({ page }) => {
    const input = example(page, "number-field").getByRole("textbox");

    await input.fill("4.5");
    await input.press("Escape");
    await input.blur();

    await expect(input).toHaveValue("1.00");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("a number outside the range is brought to the nearest limit, and the field says so", async ({ page }) => {
    const field = example(page, "number-field");
    const input = field.getByRole("textbox");

    await input.fill("7");
    await input.press("Enter");

    await expect(input).toHaveValue("5.00");
    await expect(field.getByRole("status")).toHaveText("5.00 m is the highest that can be set.");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Setback, 5, commit 1");

    await input.fill("-3");
    await input.press("Enter");
    await expect(input).toHaveValue("0.00");
    await expect(field.getByRole("status")).toHaveText("0.00 m is the lowest that can be set.");
  });

  test("what is not a number leaves the value as it was, and the field says so", async ({ page }) => {
    const field = example(page, "number-field");
    const input = field.getByRole("textbox");

    await input.fill("about one");
    await input.press("Enter");

    await expect(input).toHaveValue("1.00");
    await expect(field.getByRole("status")).toHaveText("Enter a number, from 0.00 to 5.00 m.");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("what the field says is gone after the next good entry", async ({ page }) => {
    const field = example(page, "number-field");
    const input = field.getByRole("textbox");

    await input.fill("7");
    await input.press("Enter");
    await input.fill("2");
    await input.press("Enter");

    await expect(field.getByRole("status")).toBeEmpty();
  });

  test("the arrows step the draft; they do not commit", async ({ page }) => {
    const input = example(page, "number-field").getByRole("textbox");

    await input.focus();
    await input.press("ArrowUp");
    await input.press("ArrowUp");
    await expect(input).toHaveValue("1.50");
    await input.press("ArrowDown");
    await expect(input).toHaveValue("1.25");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("in a row of the inspector the label is outside: 36 high on desktop, 48 on touch", async ({ page }, testInfo) => {
    const field = example(page, "number-field-row");
    const well = field.getByTestId("well");
    const desktop = isDesktop(testInfo.project.name);

    await expect(field.getByRole("textbox", { name: "Lower-edge clearance" })).toHaveValue("0.50");
    expect((await well.boundingBox())?.height).toBe(desktop ? 36 : 48);
    await expect(well).toHaveCSS("border-radius", desktop ? "10px" : "12px");
  });

  test("one that cannot be used is dim and takes nothing", async ({ page }) => {
    const field = example(page, "number-field-disabled");

    await expect(field.getByRole("textbox")).toBeDisabled();
    await expect(field.getByTestId("well")).toHaveCSS("opacity", "0.45");
  });
});

test.describe("Stepper", () => {
  test("a field of whole numbers between a minus and a plus", async ({ page }, testInfo) => {
    const stepper = example(page, "stepper");
    const side = isDesktop(testInfo.project.name) ? 30 : 44;

    await expect(stepper.getByRole("textbox", { name: "Modules in tilt" })).toHaveValue("2");
    await expect(stepper.getByRole("textbox")).toHaveAttribute("inputmode", "numeric");
    await expect(stepper.getByRole("textbox")).toHaveCSS("text-align", "center");
    expect(await stepper.getByRole("button", { name: "Fewer" }).boundingBox()).toMatchObject({ width: side, height: side });
    expect(await stepper.getByRole("button", { name: "More" }).boundingBox()).toMatchObject({ width: side, height: side });
    await expect(stepper.getByTestId("well")).toHaveCSS("background-color", WELL);
    await expect(stepper.getByTestId("well")).toHaveCSS("padding", "3px");
  });

  test("a press on plus or minus commits at once", async ({ page }) => {
    const stepper = example(page, "stepper");

    await stepper.getByRole("button", { name: "More" }).click();
    await expect(stepper.getByRole("textbox")).toHaveValue("3");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Modules in tilt, 3, commit 1");

    await stepper.getByRole("button", { name: "Fewer" }).click();
    await expect(stepper.getByRole("textbox")).toHaveValue("2");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Modules in tilt, 2, commit 2");
  });

  test("at an end of the range the button that leads further cannot be pressed", async ({ page }) => {
    const stepper = example(page, "stepper");
    const more = stepper.getByRole("button", { name: "More" });
    const fewer = stepper.getByRole("button", { name: "Fewer" });

    await more.click();
    await more.click();
    await expect(stepper.getByRole("textbox")).toHaveValue("4");
    await expect(more).toBeDisabled();
    await expect(more).toHaveCSS("opacity", "0.45");

    await fewer.click();
    await fewer.click();
    await fewer.click();
    await expect(stepper.getByRole("textbox")).toHaveValue("1");
    await expect(fewer).toBeDisabled();
    await expect(more).toBeEnabled();
  });

  test("a number can be typed as well", async ({ page }) => {
    const stepper = example(page, "stepper");

    await stepper.getByRole("textbox").fill("9");
    await stepper.getByRole("textbox").press("Enter");

    await expect(stepper.getByRole("textbox")).toHaveValue("4");
    await expect(stepper.getByRole("status")).toHaveText("4 is the highest that can be set.");
  });
});
