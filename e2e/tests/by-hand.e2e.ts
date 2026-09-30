import type { Page } from "@playwright/test";
import { A_MAP, findOpened, roofMap, scaleLabel, searchField } from "../find";
import { expect, test } from "../fixtures";

// Enter dimensions by hand (plan/phase-04-plan.md, step 15; the board "Enter dimensions by hand"): the
// way on without a map, and a way for anyone who has measured the roof. The rectangle by its length,
// its width and where its long side faces, or a table of corners, at the place typed or found; the plan
// drawn on the stage without a map; the same Build; the card of the Roof lens says "Entered by hand".

const RUN = 90_000;

/** A browser without WebGL: the map cannot be drawn, so the stage holds the plan. */
async function withoutWebGL(page: Page) {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) {
      if (kind === "webgl" || kind === "webgl2") return null;
      return (getContext as (this: HTMLCanvasElement, kind: string, ...rest: unknown[]) => unknown).call(this, kind, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
}

const field = (page: Page, name: string) => page.getByRole("textbox", { name });
const tile = (page: Page, label: string) => page.getByRole("region", { name: "Measurements" }).locator("div").filter({ hasText: label }).locator("code");
const byHand = (page: Page) => page.getByRole("button", { name: "Enter dimensions by hand instead" });

async function typed(page: Page, name: string, value: string) {
  await field(page, name).fill(value);
  await field(page, name).press("Enter");
}

/** The place typed as coordinates into the search: it needs no key. */
async function atThePlace(page: Page) {
  await searchField(page).fill("18.52000, 73.86000");
  await searchField(page).press("Enter");
  await expect(field(page, "Latitude")).toHaveValue("18.52000");
  await expect(field(page, "Longitude")).toHaveValue("73.86000");
}

const edgesOf = (outline: [number, number][]) => outline.map(([x, y], n) => Math.hypot(outline[(n + 1) % outline.length][0] - x, outline[(n + 1) % outline.length][1] - y));

test.describe.configure({ timeout: RUN + 30_000 });

test.describe("without a map", () => {
  test("the way on by hand: the place from the search, the rectangle typed, the plan drawn, then built; the card says entered by hand", async ({ page }) => {
    await withoutWebGL(page);
    const layouts: { roof: { outline: [number, number][]; source: string } }[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/layout")) layouts.push(request.postDataJSON());
    });
    await page.goto("/find");
    await expect(page.getByRole("status").filter({ hasText: "WebGL" })).toBeVisible();

    await page.getByRole("status").getByRole("button", { name: "Enter dimensions by hand instead" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Enter the roof by hand" })).toBeVisible();
    const plan = page.getByTestId("plan-view");
    await expect(plan).toContainText("The plan of the roof is drawn here");
    await expect(plan.getByRole("status")).toContainText("It has no WebGL.");
    await expect(page.getByRole("button", { name: "Build this roof" })).toBeDisabled();
    await expect(roofMap(page)).toHaveCount(0);

    await atThePlace(page);
    await typed(page, "Length", "90");
    await typed(page, "Width", "40");
    await expect(tile(page, "Corners")).toHaveText("—");
    await typed(page, "Long side faces", "180");

    await expect(tile(page, "Area")).toHaveText("3,600 m²");
    await expect(tile(page, "Faces")).toHaveText("180° S");
    await expect(tile(page, "Corners")).toHaveText("4");
    await expect(plan.getByTestId("plan-label")).toHaveText(["90.0 m", "40.0 m", "90.0 m", "40.0 m"]);
    await expect(plan.getByTestId("plan-scale")).toContainText(/\d+ m/);
    await expect(plan).not.toContainText("The plan of the roof is drawn here");

    await page.getByRole("button", { name: "Build this roof" }).click();

    await expect(page).toHaveURL(/\/studio\/roof$/, { timeout: RUN });
    await expect(page.getByTestId("roof-how")).toHaveText("Entered by hand · 4 corners");
    await expect(page.getByTestId("roof-size")).toHaveText("90.0 × 40.0 m · faces 180° S");
    await expect(page.getByTestId("roof-place")).toHaveText("18.52000° N, 73.86000° E");
    await expect.poll(() => layouts.length, { timeout: RUN }).toBeGreaterThan(0);
    expect(layouts[0].roof.source).toBe("coordinates");
    edgesOf(layouts[0].roof.outline).forEach((edge, n) => expect(Math.abs(edge - [90, 40, 90, 40][n]), `edge ${n + 1}`).toBeLessThanOrEqual(0.05));
  });

  test("the corner table: a row per corner, three at least; the plan follows the rows", async ({ page }) => {
    await withoutWebGL(page);
    await page.goto("/find");
    await page.getByRole("status").getByRole("button", { name: "Enter dimensions by hand instead" }).click();
    await atThePlace(page);

    await page.getByRole("radiogroup", { name: "Shape" }).getByRole("radio", { name: "Corners" }).click();
    for (let n = 0; n < 3; n += 1) await page.getByRole("button", { name: "Add a corner" }).click();
    await expect(page.getByTestId("corner-row")).toHaveCount(3);
    await typed(page, "East of corner 1", "0");
    await typed(page, "North of corner 1", "0");
    await typed(page, "East of corner 2", "30");
    await typed(page, "North of corner 2", "0");
    await typed(page, "East of corner 3", "30");
    await expect(tile(page, "Corners")).toHaveText("—");
    await typed(page, "North of corner 3", "14");

    await expect(tile(page, "Corners")).toHaveText("3");
    await expect(tile(page, "Area")).toHaveText("210 m²");
    await expect(page.getByTestId("plan-view").getByTestId("plan-label")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Build this roof" })).toBeEnabled();

    await page.getByRole("button", { name: "Remove corner 3" }).click();

    await expect(page.getByTestId("corner-row")).toHaveCount(2);
    await expect(tile(page, "Corners")).toHaveText("—");
    await expect(page.getByRole("button", { name: "Build this roof" })).toBeDisabled();
  });
});

test.describe("with a map", () => {
  test("Enter dimensions by hand instead switches the panel; the roof stands on the map at the place; Draw on the map instead goes back", async ({ page }) => {
    await findOpened(page);
    await searchField(page).fill("18.52000, 73.86000");
    await searchField(page).press("Enter");
    await expect(scaleLabel(page)).toHaveText("20 m", { timeout: A_MAP });

    await byHand(page).click();

    await expect(page.getByRole("heading", { level: 1, name: "Enter the roof by hand" })).toBeVisible();
    await expect(field(page, "Latitude")).toHaveValue("18.52000");
    await expect(page.getByRole("toolbar", { name: "Outline tools" })).toHaveCount(0);
    await typed(page, "Length", "90");
    await typed(page, "Width", "40");
    await typed(page, "Long side faces", "170");

    await expect(page.getByTestId("corner")).toHaveCount(4);
    await expect(page.getByTestId("edge-label").first()).toHaveText("90.0 m");
    await expect(tile(page, "Faces")).toHaveText("170° S");

    await page.getByRole("button", { name: "Draw on the map instead" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Outline the roof" })).toBeVisible();
    await expect(page.getByTestId("corner")).toHaveCount(4);
    await expect(page.getByRole("textbox", { name: "South" })).toHaveValue("90.0");
    await expect(page.getByRole("toolbar", { name: "Outline tools" })).toBeVisible();
  });
});
