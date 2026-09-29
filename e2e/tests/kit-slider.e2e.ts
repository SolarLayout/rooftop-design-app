import type { Locator, Page } from "@playwright/test";
import { COLOUR, example, isDesktop } from "../kit";
import { expect, test } from "../fixtures";

// Slider and RangeSlider as docs/design/components.md and the mockups have them (Main.dc.html, "Tilt" and
// "Shade-free window").

const last = (page: Page) => page.getByTestId("kit-last-pressed");

/** An example, brought into view: the pointer of a test is placed by where things are on the screen. */
async function inView(page: Page, name: string): Promise<Locator> {
  const found = example(page, name);
  await found.scrollIntoViewIfNeeded();
  return found;
}

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit"))?.status()).toBe(200);
});

test.describe("Slider", () => {
  test("a slider to a screen reader, with its value in words", async ({ page }) => {
    const handle = example(page, "slider").getByRole("slider", { name: "Tilt" });

    await expect(handle).toHaveAttribute("aria-valuemin", "0");
    await expect(handle).toHaveAttribute("aria-valuemax", "45");
    await expect(handle).toHaveAttribute("aria-valuenow", "15");
    await expect(handle).toHaveAttribute("aria-valuetext", "15°");
  });

  test("the value is shown above the track, in mono, with its unit", async ({ page }, testInfo) => {
    const slider = example(page, "slider");
    const value = slider.getByTestId("value");

    await expect(value).toHaveText("15");
    await expect(value).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
    await expect(value).toHaveCSS("font-weight", "500");
    await expect(value).toHaveCSS("font-size", isDesktop(testInfo.project.name) ? "15px" : "16px");
    await expect(slider.getByText("°", { exact: true })).toHaveCSS("color", COLOUR.text2);
    await expect(slider.getByText("Latitude 18.5° N suggests 15°")).toHaveCSS("font-size", "12px");
  });

  test("track of 4, filled in accent up to a handle of 18; of 26 on touch", async ({ page }, testInfo) => {
    const slider = example(page, "slider");
    const desktop = isDesktop(testInfo.project.name);
    const handle = slider.getByRole("slider");
    const side = desktop ? 18 : 26;

    await expect(slider.getByTestId("track")).toHaveCSS("background-color", COLOUR.line);
    expect((await slider.getByTestId("track").boundingBox())?.height).toBe(4);
    await expect(slider.getByTestId("fill")).toHaveCSS("background-color", COLOUR.accent);

    expect(await handle.boundingBox()).toMatchObject({ width: side, height: side });
    await expect(handle).toHaveCSS("background-color", COLOUR.text);
    await expect(handle).toHaveCSS("border-top-color", COLOUR.accent);
    await expect(handle).toHaveCSS("border-top-width", desktop ? "3px" : "4px");
    await expect(handle).toHaveCSS("box-shadow", /rgba\(0, 0, 0, 0\.6\) 0px 2px 6px/);

    expect((await slider.getByTestId("slide").boundingBox())?.height).toBe(desktop ? 20 : 44);
  });

  test("the handle is at its value, and never beyond the ends of the track", async ({ page }) => {
    const slider = example(page, "slider");
    const track = (await slider.getByTestId("track").boundingBox())!;
    const handle = slider.getByRole("slider");
    const middle = async () => {
      const box = (await handle.boundingBox())!;
      return box.x + box.width / 2;
    };
    const half = (await handle.boundingBox())!.width / 2;
    const way = track.width - 2 * half;

    expect(await middle()).toBeCloseTo(track.x + half + way / 3, 0);

    await handle.focus();
    await page.keyboard.press("Home");
    expect(await middle()).toBeCloseTo(track.x + half, 0);
    await page.keyboard.press("End");
    expect(await middle()).toBeCloseTo(track.x + track.width - half, 0);
  });

  test("a key changes what is shown; the value is committed when the key is released", async ({ page }) => {
    const slider = example(page, "slider");
    const handle = slider.getByRole("slider");

    await handle.focus();
    await page.keyboard.down("ArrowRight");
    await expect(slider.getByTestId("value")).toHaveText("16");
    await expect(handle).toHaveAttribute("aria-valuenow", "16");
    await expect(last(page)).toHaveText("Last pressed: nothing yet");

    await page.keyboard.up("ArrowRight");
    await expect(last(page)).toHaveText("Last pressed: Tilt, 16, commit 1");
  });

  test("a key that is held goes on, and commits once", async ({ page }) => {
    const slider = example(page, "slider");

    await slider.getByRole("slider").focus();
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.up("ArrowRight");

    await expect(slider.getByTestId("value")).toHaveText("18");
    await expect(last(page)).toHaveText("Last pressed: Tilt, 18, commit 1");
  });

  test("arrows, Page Up and Down, Home and End", async ({ page }) => {
    const slider = example(page, "slider");
    const value = slider.getByTestId("value");

    await slider.getByRole("slider").focus();
    await page.keyboard.press("ArrowLeft");
    await expect(value).toHaveText("14");
    await page.keyboard.press("ArrowUp");
    await expect(value).toHaveText("15");
    await page.keyboard.press("PageUp");
    await expect(value).toHaveText("20");
    await page.keyboard.press("PageDown");
    await page.keyboard.press("PageDown");
    await expect(value).toHaveText("10");
    await page.keyboard.press("End");
    await expect(value).toHaveText("45");
    await page.keyboard.press("Home");
    await expect(value).toHaveText("0");
    await expect(last(page)).toHaveText("Last pressed: Tilt, 0, commit 7");
  });

  test("a key that leads nowhere commits nothing", async ({ page }) => {
    const slider = example(page, "slider");

    await slider.getByRole("slider").focus();
    await page.keyboard.press("Home");
    await page.keyboard.press("Home");
    await page.keyboard.press("ArrowLeft");

    await expect(last(page)).toHaveText("Last pressed: Tilt, 0, commit 1");
  });

  test("a drag changes what is shown; the value is committed when the drag ends", async ({ page }) => {
    const slider = await inView(page, "slider");
    const handle = (await slider.getByRole("slider").boundingBox())!;
    const track = (await slider.getByTestId("track").boundingBox())!;
    const y = handle.y + handle.height / 2;

    await page.mouse.move(handle.x + handle.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width / 2, y, { steps: 4 });

    await expect(slider.getByTestId("value")).toHaveText("23");
    await expect(last(page)).toHaveText("Last pressed: nothing yet");

    await page.mouse.move(track.x + track.width + 200, y, { steps: 4 });
    await expect(slider.getByTestId("value")).toHaveText("45");

    await page.mouse.up();
    await expect(last(page)).toHaveText("Last pressed: Tilt, 45, commit 1");
  });

  test("a press on the track brings the handle there", async ({ page }) => {
    const slider = await inView(page, "slider");
    const track = (await slider.getByTestId("track").boundingBox())!;

    await page.mouse.click(track.x + track.width / 2, track.y + 2);

    await expect(slider.getByTestId("value")).toHaveText("23");
    await expect(slider.getByRole("slider")).toBeFocused();
    await expect(last(page)).toHaveText("Last pressed: Tilt, 23, commit 1");
  });

  test("the keyboard focus has its ring; the board shows it without the keyboard", async ({ page }) => {
    await expect(example(page, "slider-focus").getByRole("slider")).toHaveCSS("outline-style", "solid");
    await expect(example(page, "slider-focus").getByRole("slider")).toHaveCSS("outline-color", COLOUR.accent);
  });

  test("one that cannot be used is dim, and neither key nor pointer moves it", async ({ page }) => {
    const slider = await inView(page, "slider-disabled");
    const handle = slider.getByRole("slider");
    const track = (await slider.getByTestId("track").boundingBox())!;

    await expect(handle).toHaveAttribute("aria-disabled", "true");
    await expect(handle).toHaveAttribute("tabindex", "-1");
    await expect(slider.getByTestId("slide")).toHaveCSS("opacity", "0.45");

    await page.mouse.click(track.x + track.width - 10, track.y + 2);
    await expect(slider.getByTestId("value")).toHaveText("15");
  });
});

test.describe("RangeSlider", () => {
  test("two sliders in a group, each with its value in words and the other as its limit", async ({ page }) => {
    const group = example(page, "range-slider").getByRole("group", { name: "Shade-free window" });
    const from = group.getByRole("slider", { name: "Shade-free window, from" });
    const to = group.getByRole("slider", { name: "Shade-free window, to" });

    await expect(from).toHaveAttribute("aria-valuetext", "09:00 solar time");
    await expect(from).toHaveAttribute("aria-valuemin", "5");
    await expect(from).toHaveAttribute("aria-valuemax", "15.5");
    await expect(to).toHaveAttribute("aria-valuetext", "16:00 solar time");
    await expect(to).toHaveAttribute("aria-valuemin", "9.5");
    await expect(to).toHaveAttribute("aria-valuemax", "19");
  });

  test("the window is shown above the track; the track is filled between the handles", async ({ page }) => {
    const slider = example(page, "range-slider");
    const [from, to] = await Promise.all(
      [0, 1].map(async (index) => (await slider.getByRole("slider").nth(index).boundingBox())!),
    );
    const fill = (await slider.getByTestId("fill").boundingBox())!;

    await expect(slider.getByTestId("value")).toHaveText("09:00 – 16:00");
    await expect(slider.getByText("solar time", { exact: true })).toHaveCSS("font-size", "12px");
    expect(fill.x).toBeCloseTo(from.x + from.width / 2, 0);
    expect(fill.x + fill.width).toBeCloseTo(to.x + to.width / 2, 0);
    await expect(slider.getByTestId("ticks")).toHaveText("0508121619");
    await expect(slider.getByTestId("ticks").getByText("12")).toHaveCSS("font-size", "11px");
  });

  test("the handles never pass each other, by the keyboard", async ({ page }) => {
    const slider = example(page, "range-slider");

    await slider.getByRole("slider").first().focus();
    await page.keyboard.press("End");
    await expect(slider.getByTestId("value")).toHaveText("15:30 – 16:00");
    await page.keyboard.press("ArrowRight");
    await expect(slider.getByTestId("value")).toHaveText("15:30 – 16:00");
    await expect(last(page)).toHaveText("Last pressed: Shade-free window, 15.5 to 16, commit 1");

    await slider.getByRole("slider").last().focus();
    await page.keyboard.press("Home");
    await expect(slider.getByTestId("value")).toHaveText("15:30 – 16:00");
    await page.keyboard.press("End");
    await expect(slider.getByTestId("value")).toHaveText("15:30 – 19:00");
  });

  test("the handles never pass each other, by a drag", async ({ page }) => {
    const slider = await inView(page, "range-slider");
    const from = (await slider.getByRole("slider").first().boundingBox())!;
    const track = (await slider.getByTestId("track").boundingBox())!;
    const y = from.y + from.height / 2;

    await page.mouse.move(from.x + from.width / 2, y);
    await page.mouse.down();
    await page.mouse.move(track.x + track.width, y, { steps: 6 });
    await expect(slider.getByTestId("value")).toHaveText("15:30 – 16:00");
    await page.mouse.up();

    await expect(last(page)).toHaveText("Last pressed: Shade-free window, 15.5 to 16, commit 1");
  });

  test("a press on the track moves the handle that is nearest", async ({ page }) => {
    const slider = await inView(page, "range-slider");
    const track = (await slider.getByTestId("track").boundingBox())!;

    await page.mouse.click(track.x + track.width - 1, track.y + 2);
    await expect(slider.getByTestId("value")).toHaveText("09:00 – 19:00");

    await page.mouse.click(track.x + 1, track.y + 2);
    await expect(slider.getByTestId("value")).toHaveText("05:00 – 19:00");
  });
});
