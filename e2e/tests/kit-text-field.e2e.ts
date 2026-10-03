import AxeBuilder from "@axe-core/playwright";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// TextField as docs/design/components.md ("Text field") and the boards "Handover, previews" and "Handover, states" have it.

const WELL = "rgb(9, 12, 16)";

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("TextField", () => {
  test("recessed, with its label before it and its words in Geist at the left; 40 high on desktop, 44 on touch", async ({ page }, testInfo) => {
    const field = example(page, "text-field");
    const input = field.getByRole("textbox", { name: "Name" });

    await expect(input).toHaveValue("Pune demo roof");
    await expect(input).toHaveCSS("text-align", "start");
    await expect(input).toHaveCSS("font-family", /Geist(?! Mono)/);
    await expect(input).toHaveAttribute("maxlength", "200");
    await expect(field.getByText("Name", { exact: true })).toHaveCSS("color", COLOUR.text2);

    const well = field.getByTestId("well");
    await expect(well).toHaveCSS("background-color", WELL);
    await expect(well).toHaveCSS("border-top-color", COLOUR.line);
    await expect(well).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.65\) 0px 1px 3px 0px inset/);
    expect((await well.boundingBox())?.height).toBe(isDesktop(testInfo.project.name) ? 40 : 44);
  });

  test("with the focus: an accent line and a halo, and no ring of its own", async ({ page }) => {
    const field = example(page, "text-field");
    const well = field.getByTestId("well");

    await field.getByRole("textbox").focus();

    await expect(well).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(well).toHaveCSS("box-shadow", /rgba\(255, 176, 32, 0\.18\) 0px 0px 0px 3px/);
    await expect(field.getByRole("textbox")).toHaveCSS("outline-style", "none");
  });

  test("the board shows the focus without the keyboard", async ({ page }) => {
    await expect(example(page, "text-field-focus").getByTestId("well")).toHaveCSS("border-top-color", COLOUR.accent);
  });

  test("a press on the label leads into the field", async ({ page }) => {
    const field = example(page, "text-field");

    await field.getByText("Name", { exact: true }).click();
    await expect(field.getByRole("textbox")).toBeFocused();
  });

  test("what is typed is a draft: nothing is committed on a key", async ({ page }) => {
    const input = example(page, "text-field").getByRole("textbox");

    await input.fill("Pune demo roof, block");
    await input.pressSequentially(" B");

    await expect(input).toHaveValue("Pune demo roof, block B");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("Enter commits, once, trimmed", async ({ page }) => {
    const input = example(page, "text-field").getByRole("textbox");
    const last = page.getByTestId("kit-last-pressed");

    await input.fill("  Block B  ");
    await input.press("Enter");
    await expect(input).toHaveValue("Block B");
    await expect(last).toHaveText("Last pressed: Name, Block B, commit 1");

    await input.press("Enter");
    await input.blur();
    await expect(last).toHaveText("Last pressed: Name, Block B, commit 1");
  });

  test("leaving the field commits", async ({ page }) => {
    const input = example(page, "text-field").getByRole("textbox");

    await input.fill("Warehouse 7");
    await input.blur();

    await expect(input).toHaveValue("Warehouse 7");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Name, Warehouse 7, commit 1");
  });

  test("Escape gives the value back", async ({ page }) => {
    const input = example(page, "text-field").getByRole("textbox");

    await input.fill("Something else");
    await input.press("Escape");
    await input.blur();

    await expect(input).toHaveValue("Pune demo roof");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");
  });

  test("an empty entry is refused: the value of before stands, and the field says why; the next good entry takes the words away", async ({ page }) => {
    const field = example(page, "text-field");
    const input = field.getByRole("textbox");

    await input.fill("   ");
    await input.press("Enter");

    await expect(input).toHaveValue("Pune demo roof");
    await expect(field.getByRole("status")).toHaveText("A name is needed");
    await expect(field.getByRole("status")).toHaveCSS("font-size", "12px");
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: nothing yet");

    await input.fill("Block B");
    await input.press("Enter");
    await expect(field.getByRole("status")).toBeEmpty();
  });

  test("a hint stands under the field in the style of what it says", async ({ page }) => {
    const hint = example(page, "text-field-hint").getByText("In the name of every file");

    await expect(hint).toBeVisible();
    await expect(hint).toHaveCSS("font-size", "12px");
    await expect(hint).toHaveCSS("color", COLOUR.text2);
  });

  test("axe finds nothing serious or critical", async ({ page }) => {
    const found = await new AxeBuilder({ page }).include('[data-testid^="kit-text-field"]').analyze();
    const grave = found.violations
      .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
      .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target).join(", ")})`);

    expect(grave).toEqual([]);
  });
});
