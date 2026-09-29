import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Segmented and Switch as docs/design/components.md and the mockups have them.

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("Segmented", () => {
  test("a group of choices of which one is taken", async ({ page }) => {
    const group = example(page, "segmented").getByRole("radiogroup", { name: "Orientation" });

    await expect(group.getByRole("radio")).toHaveText(["Portrait", "Landscape"]);
    await expect(group.getByRole("radio", { name: "Portrait" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "Landscape" })).not.toBeChecked();
  });

  test("the track is recessed, the choice that is taken is raised", async ({ page }, testInfo) => {
    const group = example(page, "segmented").getByRole("radiogroup");
    const taken = group.getByRole("radio", { name: "Portrait" });
    const other = group.getByRole("radio", { name: "Landscape" });
    const desktop = isDesktop(testInfo.project.name);

    await expect(group).toHaveCSS("background-color", "rgb(9, 12, 16)");
    await expect(group).toHaveCSS("border-top-color", COLOUR.line);
    await expect(group).toHaveCSS("padding", "3px");
    await expect(group).toHaveCSS("border-radius", desktop ? "10px" : "12px");
    await expect(group).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.65\) 0px 1px 3px 0px inset/);

    await expect(taken).toHaveCSS("background-color", "rgb(35, 42, 54)");
    await expect(taken).toHaveCSS("color", COLOUR.text);
    await expect(taken).toHaveCSS("font-weight", "500");
    await expect(taken).toHaveCSS("border-radius", desktop ? "7px" : "9px");
    await expect(taken).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.55\) 0px 1px 3px/);
    await expect(taken).toHaveCSS("font-size", desktop ? "13px" : "14px");
    expect((await taken.boundingBox())?.height).toBe(desktop ? 30 : 44);

    await expect(other).toHaveCSS("background-color", COLOUR.transparent);
    await expect(other).toHaveCSS("color", COLOUR.text2);
    await expect(other).toHaveCSS("box-shadow", "none");
  });

  test("a press takes a choice", async ({ page }) => {
    const group = example(page, "segmented").getByRole("radiogroup");

    await group.getByRole("radio", { name: "Landscape" }).click();

    await expect(group.getByRole("radio", { name: "Landscape" })).toBeChecked();
    await expect(group.getByRole("radio", { name: "Portrait" })).not.toBeChecked();
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Orientation, landscape");
  });

  test("the keyboard stops at the group once, and the arrows go through the choices", async ({ page }) => {
    const group = example(page, "segmented-three").getByRole("radiogroup", { name: "Design day" });
    const winter = group.getByRole("radio", { name: "Winter solstice" });
    const june = group.getByRole("radio", { name: "21 Jun" });
    const march = group.getByRole("radio", { name: "21 Mar" });

    await winter.focus();
    await expect(winter).toHaveCSS("outline-style", "solid");

    await page.keyboard.press("ArrowRight");
    await expect(june).toBeFocused();
    await expect(june).toBeChecked();

    await page.keyboard.press("End");
    await expect(march).toBeChecked();

    await page.keyboard.press("ArrowRight");
    await expect(winter).toBeChecked();
    await expect(winter).toBeFocused();

    await expect(winter).toHaveAttribute("tabindex", "0");
    await expect(june).toHaveAttribute("tabindex", "-1");
    await expect(march).toHaveAttribute("tabindex", "-1");
  });

  test("a choice that cannot be taken is dim, and neither press nor arrow takes it", async ({ page }) => {
    const group = example(page, "segmented-with-disabled").getByRole("radiogroup");
    const middle = group.getByRole("radio", { name: "1000 V" });

    await expect(middle).toBeDisabled();
    await expect(middle).toHaveCSS("opacity", "0.45");

    await group.getByRole("radio", { name: "600 V" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(group.getByRole("radio", { name: "1500 V" })).toBeChecked();
  });

  test("it can fill the width, in equal parts", async ({ page }) => {
    const group = example(page, "segmented-fill").getByRole("radiogroup");
    const widths = await group.getByRole("radio").evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().width)));

    expect(new Set(widths).size).toBe(1);
    expect(widths.length).toBe(4);
  });
});

test.describe("Switch", () => {
  test("on: accent, the knob at the right; off: strong line, the knob at the left", async ({ page }) => {
    const on = example(page, "switch-on").getByRole("switch", { name: "Keep row pitch shade-free automatically" });
    const off = example(page, "switch-off").getByRole("switch", { name: "Allow shaded positions" });

    await expect(on).toBeChecked();
    await expect(on.getByTestId("track")).toHaveCSS("background-color", COLOUR.accent);
    await expect(on.getByTestId("knob")).toHaveCSS("background-color", COLOUR.accentInk);

    await expect(off).not.toBeChecked();
    await expect(off.getByTestId("track")).toHaveCSS("background-color", COLOUR.lineStrong);
    await expect(off.getByTestId("knob")).toHaveCSS("background-color", COLOUR.text2);
    await expect(off.getByTestId("track")).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.45\) 0px 1px 3px 0px inset/);
    await expect(off.getByTestId("knob")).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.5\) 0px 1px 3px/);

    const knobOn = await on.getByTestId("knob").boundingBox();
    const knobOff = await off.getByTestId("knob").boundingBox();
    const trackOn = await on.getByTestId("track").boundingBox();
    const trackOff = await off.getByTestId("track").boundingBox();
    expect(knobOn!.x + knobOn!.width).toBe(trackOn!.x + trackOn!.width - 3);
    expect(knobOff!.x).toBe(trackOff!.x + 3);
  });

  test("44 by 26 with a knob of 20; on touch 52 by 30 with a knob of 24, in a target of 52 by 44", async ({
    page,
  }, testInfo) => {
    const control = example(page, "switch-on").getByRole("switch");
    const desktop = isDesktop(testInfo.project.name);

    expect(await control.getByTestId("track").boundingBox()).toMatchObject(desktop ? { width: 44, height: 26 } : { width: 52, height: 30 });
    expect(await control.getByTestId("knob").boundingBox()).toMatchObject(desktop ? { width: 20, height: 20 } : { width: 24, height: 24 });
    expect(await control.boundingBox()).toMatchObject(desktop ? { width: 44, height: 26 } : { width: 52, height: 44 });
  });

  test("a press turns it, and so does the space bar", async ({ page }) => {
    const control = example(page, "switch-off").getByRole("switch");

    await control.click();
    await expect(control).toBeChecked();
    await expect(control.getByTestId("track")).toHaveCSS("background-color", COLOUR.accent);
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Allow shaded positions, on");

    // Away and back by keyboard: a ring is shown to who uses the keyboard, not after a press.
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Space");
    await expect(control).not.toBeChecked();
    await expect(page.getByTestId("kit-last-pressed")).toHaveText("Last pressed: Allow shaded positions, off");
  });

  test("one that cannot be used is dim and does not turn", async ({ page }) => {
    const control = example(page, "switch-disabled").getByRole("switch");

    await expect(control).toBeDisabled();
    await expect(control).toHaveCSS("opacity", "0.45");
    await control.click({ force: true });
    await expect(control).toBeChecked();
  });
});
