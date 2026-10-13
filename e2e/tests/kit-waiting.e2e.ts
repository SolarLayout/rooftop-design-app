import { COLOUR, example } from "../kit";
import { expect, test } from "../fixtures";

// ProgressRing and Skeleton as docs/design/components.md ("Progress ring", "Skeleton") and the board
// "Controls, part 2" have them.

test.beforeEach(async ({ page }) => {
  expect((await page.goto("/kit/part-2"))?.status()).toBe(200);
});

test.describe("ProgressRing", () => {
  test("turning, 16: how far is not known", async ({ page }) => {
    const ring = example(page, "ring-turning").getByRole("progressbar", { name: "Updating energy" });

    // By its style: what turns has a box on the screen that turns with it.
    await expect(ring).toHaveCSS("width", "16px");
    await expect(ring).toHaveCSS("height", "16px");
    await expect(ring).not.toHaveAttribute("aria-valuenow");
    await expect(ring.getByTestId("ring-track")).toHaveCSS("stroke", COLOUR.lineStrong);
    await expect(ring.getByTestId("ring-arc")).toHaveCSS("stroke", COLOUR.accent);
    await expect(ring.getByTestId("ring-arc")).toHaveCSS("stroke-linecap", "round");
    await expect(ring).toHaveCSS("animation-name", "turn");
    await expect(ring).toHaveCSS("animation-duration", "0.9s");
    await expect(ring).toHaveCSS("animation-iteration-count", "infinite");
  });

  test("turning, 12, for the state of saving", async ({ page }) => {
    const ring = example(page, "ring-saving").getByRole("progressbar", { name: "Saving" });

    await expect(ring).toHaveCSS("width", "12px");
    await expect(ring).toHaveCSS("height", "12px");
  });

  test("with an arc, 20: it says how far to a screen reader, and stands still", async ({ page }) => {
    const ring = example(page, "ring-arc").getByRole("progressbar", { name: "Computing the hourly shading of the modules" });

    expect(await ring.boundingBox()).toMatchObject({ width: 20, height: 20 });
    await expect(ring).toHaveAttribute("aria-valuenow", "62");
    await expect(ring).toHaveAttribute("aria-valuemin", "0");
    await expect(ring).toHaveAttribute("aria-valuemax", "100");
    await expect(ring).toHaveCSS("animation-name", "none");
  });

  test("with an arc and the number, 44", async ({ page }) => {
    const ring = example(page, "ring-number");
    const number = ring.getByText("62", { exact: true });

    expect(await ring.getByRole("progressbar").boundingBox()).toMatchObject({ width: 44, height: 44 });
    await expect(number).toHaveCSS("font-size", "11px");
    await expect(number).toHaveCSS("font-weight", "500");
    await expect(number).toHaveCSS("font-family", /Geist Mono|GeistMono|geistMono/i);
  });

  test("a ring beside its words is for the eye only", async ({ page }) => {
    const beside = example(page, "ring-beside-words");

    await expect(beside.getByRole("progressbar")).toHaveCount(0);
    await expect(beside.getByText("Updating energy")).toBeVisible();
  });

  test("a run in a row: the ring, the step of the engine, the percent", async ({ page }) => {
    const run = example(page, "run").getByTestId("run");

    await expect(run).toHaveCSS("background-color", COLOUR.surface2);
    await expect(run).toHaveCSS("border-radius", "12px");
    await expect(run).toHaveCSS("padding-left", "14px");
    expect((await run.boundingBox())?.height).toBe(52);
    await expect(run.getByRole("progressbar", { name: "Computing the hourly shading of the modules" })).toHaveAttribute("aria-valuenow", "62");
    await expect(run.getByText("Computing the hourly shading of the modules")).toBeVisible();
    await expect(run.getByText("62 %")).toHaveCSS("color", COLOUR.text2);
    await expect(run.getByText("62 %")).toHaveCSS("font-size", "13px");
  });

  test("under reduced motion the ring stands still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await expect(example(page, "ring-turning").getByRole("progressbar")).toHaveCSS("animation-name", "none");
  });
});

test.describe("Skeleton", () => {
  test("blocks on surface 2 in the place of a label and its value", async ({ page }) => {
    const cell = example(page, "skeleton-values").getByTestId("skeleton");

    await expect(cell).toHaveCount(6);
    await expect(cell.first()).toHaveCSS("background-color", COLOUR.surface2);
    await expect(cell.first()).toHaveCSS("border-radius", "6px");
    expect((await cell.nth(0).boundingBox())?.height).toBe(10);
    expect((await cell.nth(1).boundingBox())?.height).toBe(18);
  });

  test("the lead value is 22 high, lines of text 12", async ({ page }) => {
    expect((await example(page, "skeleton-lead").getByTestId("skeleton").last().boundingBox())?.height).toBe(22);
    expect((await example(page, "skeleton-text").getByTestId("skeleton").first().boundingBox())?.height).toBe(12);
  });

  test("it breathes in 1.6 s, and says nothing to a screen reader", async ({ page }) => {
    const block = example(page, "skeleton-text").getByTestId("skeleton").first();

    await expect(block).toHaveCSS("animation-name", "breathe");
    await expect(block).toHaveCSS("animation-duration", "1.6s");
    await expect(block).toHaveAttribute("aria-hidden", "true");
  });

  test("under reduced motion it stands still", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await expect(example(page, "skeleton-text").getByTestId("skeleton").first()).toHaveCSS("animation-name", "none");
  });
});
